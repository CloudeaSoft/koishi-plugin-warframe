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

- Item: L-002 Extend Chinese warframe aliases (issue #69) with a uniqueness spec
- PR: none yet (branch `loop/explore-chinese-aliases`; nicknames corrected from CN sources)
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — pending after source correction
- Outcome: Dropped guessed nicknames (`欺诈者`, `钉男`, `海王`, `盾妈`, `蛛后`, `天狼`, `猎户`, `决斗之子`). Replaced them with attested CN slang: Deathcraft & TH-188 国服黑话 (缴械基/运输基, 开门娃, 阿屎, 歌甲, 蝶甲, 一拳超人, 驴王, 蛆爹, 核弹猴, 蹦蹦, 扶他), WFBotSlang (弱鸡, 男工程, 夜店, 驴王, 蛆爹, 艾什, 女武神, 琉璃, 血妹, 猿), 尘墟氏族 jsauce, and 233乐园/Bilibili (西里斯/奥里昂, 9号甲, 绘影者, 炼狱使徒/乌列尔, 缚影蛛后, 猿神). Spec still asserts unique alias ownership. Did not add 无头 (jsauce Atlas nickname) because the matcher strips `头` as a part suffix. Did not add Khora `蜘蛛甲` (old glossary) because current CN usage maps 蜘蛛/蜘蛛甲 to Oraxia.
- Next: Previous type is explore, so pick a P1 optimize. Table order says L-006 (factory + override for `globalWorldState.ts`). L-020 remains: Nova `加速` / Oraxia `蜘蛛` collide with existing WFM item names.

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
