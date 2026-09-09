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

## 2 — 2026-09-09 — explore

- Item: L-002 Extend Chinese warframe aliases (issue #69)
- PR: none (manual run; branch `cursor/loop-explore-aliases-5a6d`; maintainer asked not to open a PR)
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — all green (61 files, 583 tests after the Ember alias cases)
- Outcome: Filled the empty Sirius & Orion list with official copy (众星, 决斗之子) and star names (天狼星, 猎户座); added Follie's 绘影者 / 狂墨 and Ember's Changyou name 余烬. Added `tests/services/wfm/warframeAlias.spec.ts` so every normalized alias, including the auto `甲` form, maps to exactly one warframe. Live `wmi 余烬` resolves to Ember Prime Set; `wmi 众星` / `wmi 绘影者` stay not-found because Warframe Market has no non-Prime Follie or Sirius items yet.
- Next: Previous type is explore, so pick a P1 optimize. Table order says L-006 (globalWorldState factory + override). Issue #69 stays open (L-021). Matcher order for `加速` vs Quickening is L-020.

## 1 — 2026-09-09 — optimize

- Item: L-001 Align `CONTRIBUTING.md` with the current layout
- PR: https://github.com/CloudeaSoft/koishi-plugin-warframe/pull/105
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — all green (60 files, 570 tests)
- Outcome: Rewrote `CONTRIBUTING.md` to match `AGENTS.md`: `src/warframe/` domain layers, HTTP via `src/warframe/utils/http.ts`, `WarframeResult<T>` plus `src/i18n.ts`, Koishi-scoped logging, and the CI command set including `yarn lint`. Removed the broken `docs/architecture.md` link and pointed architecture at `AGENTS.md` instead of adding a duplicate document. Added `tests/meta/contributing.spec.ts` so those paths cannot drift again.
- Next: Previous type is optimize, so pick a P1 explore. Table order says L-002 (Chinese aliases, issue #69). L-003 (`steelpath`) is the unused-world-state alternative if aliases look too large.

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
