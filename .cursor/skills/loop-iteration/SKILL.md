---
name: loop-iteration
description: Run one autonomous improvement iteration for koishi-plugin-warframe (pick one backlog item, implement with tests, validate, open a draft PR, update backlog and journal). Use when triggered by the merge-driven Cursor Automation or when asked to "run a loop iteration".
---

# Loop iteration

One iteration produces at most one small, fully validated draft pull request,
or a backlog-only PR when nothing is ready to build. The design and guardrails
are in `docs/loop/README.md`; read it once before starting.

## 0. Work-in-progress guard (WIP = 1)

```bash
gh pr list --repo CloudeaSoft/koishi-plugin-warframe --state open --search "loop-iteration in:body" --json number,title,url
```

If any PR is returned, stop immediately and report "loop PR #N is still
open". Do not create a branch, do not open a second PR.

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

If nothing is selectable, do a **grooming iteration**: add new candidates from
these sources, each with a one-line rationale and a priority, then continue to
step 5 with only `docs/loop/backlog.md` and `docs/loop/journal.md` changed.

Explore sources:

- `TODO.md` and open GitHub issues (`gh issue list --state open`).
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

## 6. Capture evidence (screenshots)

Every PR carries a screenshot of what the iteration produced, so the reviewer
sees the result without running the bot.

- **Visual changes** (anything under `src/components/`, `src/messages/`,
  `src/commands/`, or a README command row): render the affected component
  with `yarn preview`.
  1. Add or update an entry `tests/previews/<feature>.preview.tsx` whose
     default export returns the Element to render. Prefer live data through
     the Warframe facade and fall back to a fixture when the query fails
     (`api.warframe.com` often rejects Cloud Agent egress); write a one-line
     note to stderr saying which source was used. Copy
     `tests/previews/alert.preview.tsx`.
  2. Run `yarn build` (previews resolve assets from `lib/`), then
     `yarn preview tests/previews/<feature>.preview.tsx --out /opt/cursor/artifacts/loop-<N>-<slug>.png`
     (`mkdir -p /opt/cursor/artifacts` first). Open the PNG and check that it
     shows the intended state, not an error or empty card.
  3. Render one PNG per distinct state worth reviewing (populated, empty,
     before/after for layout changes). Keep it to the minimal set.
- **Non-visual changes** (services, data, infrastructure, docs, tests):
  produce a text screenshot of the proof instead. Save the tail of the
  validation run and any focused test output to
  `/opt/cursor/artifacts/loop-<N>-validation.txt`, and in the PR body state
  "no visual output" with the reason.
- Never fabricate a preview with made-up data presented as live. A fixture is
  fine; label it as a fixture in the alt text and body.

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
  message. The body must contain the literal line `loop-iteration: <N>` (the
  WIP guard searches for it), the item text, the validation commands run,
  anything a human reviewer should decide, and an **Evidence** section that
  embeds each artifact from step 6 with an absolute path, for example
  `<img alt="alert command, fixture data" src="/opt/cursor/artifacts/loop-<N>-alert.png" />`.
  The PR tool uploads files referenced this way and rewrites the paths to
  public URLs.
- After creating the PR, run `gh pr view <url> --json body --jq .body` and
  confirm the `src` attributes now point at `https://` URLs. If they still
  contain `/opt/cursor/artifacts`, the upload did not happen: commit the PNGs
  under `docs/loop/evidence/<N>/` in a follow-up commit and reference them
  with relative links instead.
- Never merge, never enable auto-merge, never force-push.

## Quality bar

- Small: prefer under 400 changed lines excluding fixtures and generated data.
- Complete: tests, README rows, i18n messages, preview entries, and
  backlog/journal updates ship in the same PR; the PR body shows the result.
- Honest: if the change is speculative or the data source is unverified, say
  so in the PR body rather than smoothing it over.
