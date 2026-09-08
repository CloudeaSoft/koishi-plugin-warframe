# Loop Engineering

A merge-driven improvement loop for `koishi-plugin-warframe`, built on Cursor
Cloud Agents. Every time a pull request is merged into `master`, a Cursor
Automation starts one Cloud Agent that performs a single, small, fully
validated iteration (a new feature or an optimization) and opens a draft PR.
A human reviews and merges; the merge starts the next iteration.

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
                   6. open a draft PR (body contains `loop-iteration: N`)
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
| Cloud Agent environment | Cursor dashboard, saved environment | maintainer |
| Validation | `.github/workflows/build-and-test.yml` | repository |

The repository holds everything that should be versioned and reviewable (the
procedure, the rules, the backlog, the history). The dashboard holds the two
things that must not live in git: the trigger wiring and the environment
credentials.

## Decisions

- **Trigger**: any pull request merged into `master`, including human and
  Dependabot PRs. Merging anything is a way to request another iteration.
- **Work in progress limit**: 1. If a loop PR is open, a triggered run exits
  without doing anything. The guard searches open PRs for the body line
  `loop-iteration:`; keep that line intact when editing PR descriptions.
- **Selection**: by priority (`P0` > `P1` > `P2`) across both explore and
  optimize items. Ties go to the type not used by the previous iteration.
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

## Guardrails

Loop PRs never:

- merge, enable auto-merge, or force-push;
- modify `.github/workflows/`, `.releaserc.yml`, or secrets;
- bump dependency major versions;
- add a package-local `yarn.lock`;
- use `console.*`, raw `fetch()`, or cross layer boundaries (`AGENTS.md`);
- skip a failing validation command. If the item cannot be finished green, the
  run reverts the implementation and turns into a grooming iteration that only
  updates the backlog and journal.

Two merges within a few minutes can start two runs before either has opened a
PR. The skill re-runs the WIP guard right before opening the PR; the later run
abandons its branch and reports instead of opening a second PR.

## Setup (one time, maintainer)

1. **Environment**: save a Cloud Agent environment for this repository in the
   Cursor dashboard using the install script above. Verify a fresh agent can
   run `yarn build && yarn dtsc && yarn lint && yarn test` green.
2. **Bugbot**: enable Bugbot for `CloudeaSoft/koishi-plugin-warframe`. Review
   rules are read from `.cursor/BUGBOT.md`. A private automation opens PRs as
   your GitHub account, which satisfies Bugbot's "PRs you author" rule.
3. **Automation**: at `cursor.com/automations` create a new automation:
   - Trigger: GitHub → Pull request merged; repository
     `CloudeaSoft/koishi-plugin-warframe`, branch `master`.
   - Repository: single repository, the same one, base branch `master`.
   - Tools: keep "Pull request creation" on; enable "Memory" so runs can hand
     over a summary (`loop_last_iteration`).
   - Prompt: paste `docs/loop/prompts/loop-iteration.md` verbatim.
   - Save and activate.
4. **Kick off**: merge the bootstrap PR that adds these files. That merge is
   the first trigger.

## Operating the loop

- **Pause**: disable the automation in the dashboard. Open loop PRs can still
  be reviewed and merged; nothing new starts.
- **Steer**: edit `docs/loop/backlog.md` directly. Raise a priority to make an
  item next, add `blocked by:` to hold one, or add new candidates. Merging that
  edit as a PR also triggers the next run.
- **Run manually**: start a Cloud Agent on `master` with the prompt "Run one
  loop iteration using the `loop-iteration` skill." The same WIP guard applies.
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
