---
name: loop-iteration
description: Run one autonomous improvement iteration for koishi-plugin-warframe (pick one backlog item, implement with tests, validate, open a draft PR, update backlog and journal). Use when triggered by the merge-driven Cursor Automation or when asked to "run a loop iteration".
---

# Loop iteration

One iteration produces at most one small, fully validated draft pull request,
or a backlog-only PR when nothing is ready to build. The design and guardrails
are in `docs/loop/README.md`; read it once before starting.

You may have been started by a merge into `master`, by the automation's
schedule, by its webhook, or by hand. The trigger does not change anything
below; the merged PR (if any) is context only.

## 0. Work-in-progress guard (WIP = 1)

```bash
gh pr list --repo CloudeaSoft/koishi-plugin-warframe --state open --search "loop-iteration in:body" --json number,title,url
```

If any PR is returned, stop immediately and report "loop PR #N is still
open". Do not create a branch, do not open a second PR.

Then check for a concurrent run (two merges minutes apart start two runs
before either has a PR). With the `cursor-cloud` MCP tools: `run-info` gives
your own id; `list-cloud-agents` with `sources: ["automations"]`,
`statuses: ["RUNNING"]`, and `createdAfter` one hour ago lists the others. If
another loop run (same automation, same name) was created before yours, stop
and report it; the older run owns this iteration. If the tools are
unavailable, continue; the pre-PR re-check in step 7 still applies.

## 1. Load state

Read, in this order:

1. `AGENTS.md` (conventions and layer rules).
2. `docs/loop/backlog.md` (candidates with priority and status).
3. `docs/loop/journal.md` (what previous iterations did and recommended).
4. Recent history: `git log --oneline -15` and
   `gh pr list --state merged --limit 5 --json title,mergedAt`.

If the Cursor Automation exposes a memory tool, also read key
`loop_last_iteration` for the previous run's summary.

## 2. Select one item

Selection is by priority, mixing explore and optimize items:

- Pick the highest-priority item whose status is `todo` (P0 before P1 before
  P2). Ties: prefer the item whose type differs from the previous iteration.
- Skip items whose `blocked by` is unresolved.
- Do not pick an item that needs secrets, production credentials, dependency
  major upgrades, or changes to `.github/workflows/` or `.releaserc.yml`.
- Do not pick community-sourced content that belongs to public contributors:
  Chinese warframe nicknames, slang / 黑话 tables, expansions of
  `src/warframe/assets/warframeAlias.json`, or GitHub issue #69. Leave those
  for human PRs.

If nothing is selectable, do a **grooming iteration**: add new candidates from
these sources, each with a one-line rationale and a priority, then continue to
step 5 with only `docs/loop/backlog.md` and `docs/loop/journal.md` changed.

Explore sources:

- `TODO.md` and open GitHub issues (`gh issue list --state open`), skipping
  issues that are community nickname or slang lists.
- Placeholder commands (`lich-c`, `lich-i`) and README "In Development" rows.
- World-state fields the plugin does not surface yet. Compare the fields on the
  `warframe-worldstate-parser` result used in `src/warframe/data/wf/globalWorldState.ts`
  with the queries exported from `src/warframe/services/wf-service.ts`.
- Warframe Market endpoints available in `wfm-api-client` that no service uses.

Optimize sources:

- The "Current Maintenance Notes" section of `AGENTS.md`.
- Documentation drift between `README.md`, `CONTRIBUTING.md`, and `AGENTS.md`.
- Coverage gaps (`yarn vitest run --coverage` and the `functions` threshold in
  `vitest.config.ts`), dead exports, duplicated helpers.
- Cache TTLs, retry behavior, or rendering cost visible in `src/components/`.

## 3. Implement

1. `git checkout -b loop/<type>-<short-slug>` from `master`.
2. Mark the item `in-progress` in `docs/loop/backlog.md`.
3. Implement the change following `AGENTS.md`. For new commands use the
   `add-wf-command` skill. Keep the diff focused on the single item.
4. Write or update tests first when practical. No live network in tests.

## 4. Validate

```bash
yarn build && yarn dtsc && yarn lint && yarn test
```

Every command must exit 0. If a failure cannot be fixed within the scope of
the item, revert the implementation, set the item back to `todo` with a
`blocked by:` note describing the failure, and proceed as a grooming iteration.

## 5. Record

- `docs/loop/backlog.md`: set the item to `done` (or `todo` with `blocked by`),
  add any follow-up candidates discovered while working.
- `docs/loop/journal.md`: prepend an entry using the template at the top of
  the file (iteration number, date, type, item, PR, validation output summary,
  recommendation for the next run).
- If a memory tool is available, save key `loop_last_iteration` with the
  iteration number, type, item title, and PR URL.

## 6. Capture evidence (talk to the bot)

Every PR shows what the bot actually replied, so the reviewer sees the result
without running it. `yarn capture` boots the built plugin inside a real Koishi
app (mock adapter, in-memory database, cron, `koishi-plugin-puppeteer` on the
local Chrome), sends each argument as a chat message, and saves the replies:
images are decoded to PNG, text goes to a `.txt` next to them.

Decide where the files live first. Under the automation, the only PR tool is
`open_git_pr`; it does not upload `/opt/cursor/artifacts/` and cannot edit the
body later, so write to `docs/loop/evidence/<N>/` and commit it with the
iteration. As an ordinary Cloud Agent (the `ManagePullRequest` tool exists),
write to `/opt/cursor/artifacts/`, which the PR tool uploads. Below,
`<evidence>` stands for whichever directory applies.

- **Behaviour changes** (anything under `src/commands/`, `src/components/`,
  `src/messages/`, `src/services/`, or a README command row):
  1. `yarn build` (the harness loads `lib/index.js`), then
     `mkdir -p <evidence>` and
     `yarn capture --out <evidence> --prefix loop-<N> "<message>" ["<message>" ...]`
     using the exact messages a user would type (the command, its aliases if
     they matter, an argument that hits the new path, and one that misses).
  2. Read the printed manifest, then open each PNG and `.txt` and check they
     show the intended state, not an error or an empty card. A missing reply
     makes the script exit 1; treat that as a failed iteration, not as
     "nothing to show".
  3. Keep the set minimal: one capture per distinct state worth reviewing,
     and no more than three PNGs when they are committed to the repository.
- **Non-visual changes** (data, infrastructure, docs, tests): save the tail of
  the validation run and any focused test output to
  `<evidence>/loop-<N>-validation.txt`, and state "no visual output" in the
  PR body with the reason.
- Data sources: Warframe Market is reached live. `api.warframe.com` rejects
  Cloud Agent egress, so world-state commands replay
  `tests/assets/example-world-state.json` with its timestamps shifted to now;
  the manifest's first line says which source was used. Copy that line into
  the PR body. Never present a fixture as live data.

## 7. Commit and open the PR

- Re-run the WIP guard from step 0 first. Two merges close together can start
  two runs; if a loop PR appeared while you were working, do not open a
  second one. Report the branch name and the competing PR, then stop.
- Commits follow Conventional Commits with scopes `wf`, `wfm`, `miscs`,
  `readme`, `deps`, or none. One logical change per commit; keep them clean
  enough to rebase onto `master` without fixups.
- Stage files by path. `yarn install --no-immutable` leaves an untracked
  `yarn.lock` and `.yarn/` in the checkout; never commit them (the lockfile is
  owned by the parent Koishi workspace).
- Open a **draft** PR against `master` whose title is the primary commit
  message. Write the body completely the first time: the automation's
  `open_git_pr` cannot edit it afterwards and `gh` is read-only. It must
  contain the literal line `loop-iteration: <N>` (the WIP guard searches for
  it), the item text, the validation commands run, anything a human reviewer
  should decide, and an **Evidence** section that embeds each file from step 6,
  quotes text replies, and names the data source.
  - Committed evidence (automation runs): relative links, e.g.
    `![fissure](docs/loop/evidence/<N>/loop-<N>-fissure.png)`; the files must
    be in a pushed commit before the PR is opened.
  - Artifact evidence (ordinary Cloud Agent runs): the tags the manifest
    prints, e.g. `<img alt="alert" src="/opt/cursor/artifacts/loop-<N>-alert.png" />`;
    the PR tool uploads them and rewrites the paths. Afterwards run
    `gh pr view <url> --json body --jq .body` and confirm each reference became
    an `https://` URL; if the literal path `/opt/cursor/artifacts/` remains,
    commit the files under `docs/loop/evidence/<N>/` and link them relatively
    in a follow-up commit.
- Never merge, never enable auto-merge, never force-push.

## Quality bar

- Small: prefer under 400 changed lines excluding fixtures and generated data.
- Complete: tests, README rows, i18n messages, and backlog/journal updates
  ship in the same PR; the PR body shows the bot's actual replies.
- Honest: if the change is speculative or the data source is unverified, say
  so in the PR body rather than smoothing it over.
