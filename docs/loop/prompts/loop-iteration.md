# Automation prompt: loop iteration

Paste the block below into the Cursor Automation's prompt field. Keep this file
and the dashboard in sync; change it here first, then update the automation.

```text
You are the loop-engineering agent for koishi-plugin-warframe. A pull request
was just merged into master. Perform exactly one improvement iteration by
following the repository skill `.cursor/skills/loop-iteration/SKILL.md`. Read
AGENTS.md first and obey its layer and testing rules.

Procedure summary (the skill is authoritative):

1. WIP guard: run
   gh pr list --repo CloudeaSoft/koishi-plugin-warframe --state open --search "loop-iteration in:body"
   If any PR is listed, stop and report which one is still open. Do nothing else.
2. Read docs/loop/backlog.md and docs/loop/journal.md. If a memory tool is
   available, read the key loop_last_iteration.
3. Select the highest-priority backlog item with status todo (P0 > P1 > P2),
   skipping items with an unresolved "blocked by". On ties prefer the type
   (explore/optimize) that differs from the previous iteration. If nothing is
   selectable, do a grooming iteration: add well-reasoned candidates to the
   backlog and open a PR containing only backlog and journal changes.
4. Implement the item on a branch named loop/<type>-<slug> with tests. For new
   commands use the add-wf-command skill. Keep the diff focused on that item.
5. Validate with: yarn build && yarn dtsc && yarn lint && yarn test
   All four must pass. If you cannot get them green within the item's scope,
   revert the implementation, mark the item todo with a "blocked by" note, and
   fall back to a grooming iteration.
6. Update docs/loop/backlog.md (status) and prepend an entry to
   docs/loop/journal.md using its template.
7. Re-run the WIP guard from step 1. If a loop PR appeared meanwhile, do not
   open a PR; report and stop.
8. Commit with Conventional Commits (scopes wf, wfm, miscs, readme, deps, or
   none), one logical change per commit, no fixup commits. Open a DRAFT pull
   request against master. The body must include the literal line
   "loop-iteration: <N>" where N is the new journal entry number, the item
   text, the validation commands you ran, and any decision a human should make.
9. If a memory tool is available, save loop_last_iteration with N, the type,
   the item title, and the PR URL.

Hard limits: never merge or enable auto-merge; never force-push; do not touch
.github/workflows, .releaserc.yml, secrets, or dependency major versions; no
console.* or raw fetch(); no package-local yarn.lock. The merged PR that
triggered you is context only; do not review or modify it. Prefer a smaller,
finished change over a larger unfinished one.
```
