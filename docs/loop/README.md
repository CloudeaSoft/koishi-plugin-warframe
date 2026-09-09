# Loop Engineering

A merge-driven improvement loop for `koishi-plugin-warframe`, built on Cursor
Cloud Agents. Every time a pull request is merged into `master`, a Cursor
Automation starts one Cloud Agent that performs a single, small, fully
validated iteration (a new feature, an optimization, or a fix) and opens a
draft PR. A human reviews and merges; the merge starts the next iteration.

```text
 you merge a PR ──▶ Cursor Automation (trigger: Pull request merged)
                          │
                          ▼
                 Cloud Agent runs the `loop-iteration` skill
                   0. WIP guard: an open loop PR? → stop
                   1. load backlog + journal (+ memory)
                   2. pick the highest-priority `todo` item
                   3. implement on a branch, with tests
                   4. yarn build && yarn dtsc && yarn lint && yarn test
                   5. update backlog + journal in the same branch
                   6. chat with the bot via `yarn capture` → replies in /opt/cursor/artifacts
                   7. open a draft PR (body contains `loop-iteration: N` + evidence)
                          │
                          ▼
             CI (build-and-test) + Bugbot review ──▶ you review / merge ──▶ loop
```

## Components

| Piece | Where | Owner |
| --- | --- | --- |
| Trigger and prompt | Cursor dashboard, Automations | maintainer (see setup) |
| Iteration procedure | `.cursor/skills/loop-iteration/SKILL.md` | repository |
| Command pattern | `.cursor/skills/add-wf-command/SKILL.md` | repository |
| Coding rules | `AGENTS.md` | repository |
| Review rules | `.cursor/BUGBOT.md` | repository |
| Candidates | `docs/loop/backlog.md` | repository, edited by every iteration |
| History | `docs/loop/journal.md` | repository, edited by every iteration |
| Prompt source of truth | `docs/loop/prompts/loop-iteration.md` | repository, paste into the Automation |
| Evidence tooling | `scripts/capture.mjs` (`yarn capture`) | repository |
| Cloud Agent environment | Cursor dashboard, saved environment | maintainer |
| Validation | `.github/workflows/build-and-test.yml` | repository |

The repository holds everything that should be versioned and reviewable (the
procedure, the rules, the backlog, the history). The dashboard holds the two
things that must not live in git: the trigger wiring and the environment
credentials.

## Decisions

- **Triggers**: the same automation has three, and a run behaves identically
  whichever one fired it:
  - *Pull request merged* into `master`: the normal path; merging anything is a
    way to request another iteration.
  - *Scheduled* (every 6 hours): the safety net. If a merge trigger failed to
    start a run (the first live merge of a loop PR did, with a Cursor-side
    permission error), the next tick picks the loop up again. When a loop PR is
    already open the tick exits at the WIP guard within a minute.
  - *Webhook*: the manual "run now" button; see Operating the loop.
- **Work in progress limit**: 1. If a loop PR is open, a triggered run exits
  without doing anything. The guard searches open PRs for the body line
  `loop-iteration:`; keep that line intact when editing PR descriptions.
- **Selection**: by priority (`P0` > `P1` > `P2`) across explore, optimize, and
  fix items. Ties go to the type not used by the previous iteration.
  Skip community-sourced content (Chinese nicknames, `warframeAlias.json`,
  issue #69); that belongs to public contributors.
- **Scope of one iteration**: one backlog item, one draft PR, ideally under 400
  changed lines excluding fixtures.
- **Environment**: a dashboard-saved Cloud Agent environment rather than a
  committed `.cursor/environment.json`, so the loop's toolchain is managed in
  one place without touching the repository. Its install script is:

```bash
corepack enable
corepack prepare yarn@4.5.3 --activate
yarn install --no-immutable
yarn build
```

## Evidence in every PR

Reviewers should see what the bot replied without running one. Each loop PR
carries an **Evidence** section:

- For behaviour changes (commands, components, messages, services, README
  command rows) the agent talks to the bot:
  `yarn capture --out /opt/cursor/artifacts --prefix loop-<N> "fissure" "wmi 龙 prime"`.
  The script boots a real Koishi `App` in the agent's process with the built
  plugin (`lib/index.js`) and the services it requires: `koishi-plugin-cron`,
  `@koishijs/plugin-database-memory`, `@koishijs/plugin-http`, and
  `koishi-plugin-puppeteer` driving the local Chrome. `@koishijs/plugin-mock`
  provides the chat client. Every argument is delivered as a message, so the
  reply goes through the same command → service → component → Puppeteer path
  a production bot uses; the harness then decodes the `<img>` elements in the
  replies to PNG files and writes text replies to `.txt`, and prints a
  Markdown manifest with ready-to-paste `<img>` tags.
- Data sources: Warframe Market is reached live from the Cloud Agent.
  `api.warframe.com` rejects Cloud Agent egress, so unless `--worldstate live`
  succeeds the harness replays `tests/assets/example-world-state.json` through
  a `fetch` shim, with every timestamp shifted forward by the snapshot's age so
  fissures and cycles look current. The manifest's first line names the source
  and the PR body repeats it; a fixture is never presented as live data.
- For non-visual changes the agent saves the validation output as a text
  artifact and states "no visual output".
- Where the files go depends on how the run was started. Automation runs only
  have the automation's `open_git_pr` tool, which neither uploads
  `/opt/cursor/artifacts/` files nor edits a PR body afterwards (iteration 1
  shipped a dead artifact link this way). Automation runs therefore commit the
  evidence under `docs/loop/evidence/<N>/` in the same PR and reference it with
  relative links, keeping it to a few PNGs plus the `.txt` replies. Runs
  started as ordinary Cloud Agents have the regular PR tool, which uploads
  `/opt/cursor/artifacts/` files and rewrites the paths to
  `https://cursor.com/artifacts/...` URLs; "Allow Posting Artifacts to GitHub"
  under
  [Cloud Agents → My Pull Requests](https://cursor.com/dashboard/cloud-agents#my-pull-requests)
  makes those render inline. Only game-data renders and validation output are
  ever attached, never logs that could contain credentials.

Maintainers can reproduce any capture locally with the same command after
`yarn build`; set `PUPPETEER_EXECUTABLE_PATH` if Chrome is not on a standard
path, and pass `--worldstate live` to insist on the real API.

## Guardrails

Loop PRs never:

- merge, enable auto-merge, or force-push;
- modify `.github/workflows/`, `.releaserc.yml`, or secrets;
- bump dependency major versions;
- add a package-local `yarn.lock`;
- use `console.*`, raw `fetch()`, or cross layer boundaries (`AGENTS.md`);
- skip a failing validation command. If the item cannot be finished green, the
  run reverts the implementation and turns into a grooming iteration that only
  updates the backlog and journal;
- curate `warframeAlias.json` or other community slang / nickname tables
  (public contributors own those).

Two merges within a few minutes can start two runs before either has opened a
PR (this happened on 2026-09-09 when #103 and #104 merged three minutes apart:
both runs implemented L-001 before the later one stopped at the pre-PR guard).
The WIP guard therefore also lists running agents of this automation through
the `cursor-cloud` MCP tools and yields to an older one at step 0, and it is
re-run right before opening the PR; the later run abandons its branch and
reports instead of opening a second PR.

## Setup (one time, maintainer)

1. **Environment**: save a Cloud Agent environment for this repository in the
   Cursor dashboard using the install script above. Verify a fresh agent can
   run `yarn build && yarn dtsc && yarn lint && yarn test` green.
2. **Bugbot**: enable Bugbot for `CloudeaSoft/koishi-plugin-warframe`. Review
   rules are read from `.cursor/BUGBOT.md`. A private automation opens PRs as
   your GitHub account, which satisfies Bugbot's "PRs you author" rule.
3. **Automation**: at `cursor.com/automations` create a new automation:
   - Triggers (an automation may have several; a run starts when any fires):
     GitHub → Pull request merged, repository
     `CloudeaSoft/koishi-plugin-warframe`, branch `master`; Scheduled, cron
     `0 */6 * * *`; Webhook. The webhook URL and API key appear after the
     first save; keep them out of the repository.
   - Repository: single repository, the same one, base branch `master`.
   - Tools: keep "Pull request creation" on; enable "Memory" so runs can hand
     over a summary (`loop_last_iteration`).
   - Prompt: paste `docs/loop/prompts/loop-iteration.md` verbatim.
   - Save and activate.
4. **Inline evidence**: in the Cloud Agents dashboard, under My Pull Requests,
   enable "Allow Posting Artifacts to GitHub" so screenshots render directly in
   PR bodies instead of as login-gated links.
5. **Kick off**: merge the bootstrap PR that adds these files. That merge is
   the first trigger.

## Operating the loop

- **Pause**: disable the automation in the dashboard. Open loop PRs can still
  be reviewed and merged; nothing new starts.
- **Steer**: edit `docs/loop/backlog.md` directly. Raise a priority to make an
  item next, add `blocked by:` to hold one, or add new candidates. Merging that
  edit as a PR also triggers the next run.
- **Run now / restart after a failed trigger**: POST to the automation's
  webhook (URL and key from the automation's Webhook trigger card):

  ```bash
  curl -sS -X POST "$LOOP_WEBHOOK_URL" -H "Authorization: Bearer $LOOP_WEBHOOK_KEY"
  ```

  This starts a run inside the automation itself, with its memory, tools, and
  identity. If nothing is done, the scheduled trigger starts one within six
  hours anyway. Do not open an empty PR just to trigger a run.
- **Run outside the automation**: start a Cloud Agent on `master` from
  `cursor.com/agents` with the prompt "Run one loop iteration using the
  `loop-iteration` skill." The same WIP guard applies; the run has no
  automation memory and opens the PR with the regular Cloud Agent PR tool.
- **Failed trigger diagnosis**: the automation's run list shows attempts that
  failed before an agent existed; agent-side transcripts do not. From any Cloud
  Agent, `cursor-cloud list-cloud-agents` with source `automations` lists the
  runs that did start.
- **Change the prompt**: edit `docs/loop/prompts/loop-iteration.md` in a PR and
  paste the merged version into the automation, so the dashboard and the repo
  stay in sync.
- **Inspect**: `docs/loop/journal.md` is the ledger; the Automation's run list
  in the dashboard has transcripts and diffs.

## Why not a GitHub Actions loop

Running Cursor CLI headlessly from a `pull_request: closed` workflow would keep
the trigger in the repository, but needs a `CURSOR_API_KEY` secret, inherits
Actions time limits, and has no memory across runs. The Automation keeps the
same event source, runs in the saved Cloud Agent environment, and opens PRs
through Cursor's own tooling. Revisit if the loop needs to run without a Cursor
subscription.
