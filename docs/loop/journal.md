# Loop journal

Newest entry first. Every iteration prepends one entry using this template:

```markdown
## N — YYYY-MM-DD — <explore|optimize|grooming>

- Item: L-XXX <title>
- PR: <url>
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — <all green | what failed>
- Outcome: <one or two sentences on what changed and why>
- Next: <recommendation for the following run: follow-ups, blockers, ideas>
```

## 0 — 2026-09-08 — bootstrap

- Item: set up the merge-driven loop
- PR: bootstrap PR (this change)
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — all green from a
  Cloud Agent checkout at `/workspace` after fixing the tests' package-root
  detection (22 assertions previously failed on ENOENT)
- Outcome: added the `loop-iteration` and `add-wf-command` skills,
  `.cursor/BUGBOT.md`, this backlog and journal, and the automation prompt;
  corrected the test runner commands in `AGENTS.md`; added `yarn capture`
  (`scripts/capture.mjs`), which boots the built plugin in a real Koishi app
  with a mock chat client and saves the bot's replies (PNG and text), so
  every loop PR embeds what the bot actually answered
- Next: L-001 (CONTRIBUTING.md drift) is the only P0 and needs no new data;
  after that, alternate between the P1 world-state commands (L-003..L-005)
  and the injection refactors (L-006..L-008)
