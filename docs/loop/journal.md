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

- Item: L-002 Extend Chinese warframe aliases with a uniqueness spec (issue #69)
- PR: none (branch `cursor/loop-explore-aliases-d3b6`; PR skipped by request). Loop PR #106 was already open at step 0.
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — all green (61 files, 617 tests)
- Outcome: Extracted `buildWarframeAliasDict` / `findWarframeAliasCollisions` so CI fails if two warframes share a nickname (including auto `甲` forms). Aliases are taken from Chinese Warframe pages, not invented transliterations: 17173《黑话术语大全（战甲篇）》 (缴械基 / 运输基 / 开门娃 / 沙甲 / 蝶甲 / 工程), 星际云玩家国服用语 (弱鸡 / 圣拳武僧 / 离火幻灵), 木答案掉落帖 (花妈 / 球妈 / 蛇佬), 233乐园 (缚影蛛后 / 炼狱使徒 / 乌列尔), and 17173 国服公告 (西里斯&奥里昂, 缮写士, 蘑菇小子, 狂墨 / 绘影者). Guessed names (隐身, 沃班, 海贼, 天狼 / 猎户座) were removed. Live `wmi`: 缴械基 → Loki Prime Set, 工程统帅 → Vauban Prime Set, 沙甲 → Inaros Prime Set. Sirius & Orion is not on Warframe Market yet (`wmi 西里斯` → 未找到物品).
- Next: Previous type is explore, so pick a P1 optimize. Table order says L-006 (factory + override for `globalWorldState.ts`). L-003 (`steelpath`) is the next P1 explore after that. Re-check Sirius & Orion on WFM once the item is listed.

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
