# Loop journal

Newest entry first. Every iteration prepends one entry using this template:

```markdown
## N — YYYY-MM-DD — <explore|optimize|grooming|fix>

- Item: L-XXX <title>
- PR: <url>
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — <all green | what failed>
- Outcome: <one or two sentences on what changed and why>
- Next: <recommendation for the following run: follow-ups, blockers, ideas>
```

## 10 — 2026-09-10 — optimize

- Item: L-025 Extract world-state board modules (alert, invasion, nightwave, steel-essence, fissure, void-trader, environment, calendar)
- PR: https://github.com/CloudeaSoft/koishi-plugin-warframe/pull/116
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — all green (71 files, 625 tests)
- Outcome: Moved the eight world-state board clusters from `wf-service/index.ts` into mapped modules. Public imports stay on the services barrel. Relic, arbitration, sortie, weekly, bounty, and circuit remain in `index.ts` for L-026.
- Next: Previous type is optimize. No P1 explore remains, so pick P1 optimize L-026 (remaining wf-service modules). Split that item if the diff exceeds ~400 lines.

## 9 — 2026-09-10 — optimize

- Item: L-024 Extract `wf-service.riven.ts` (OCR, stats, weekly rivens, disposition)
- PR: https://github.com/CloudeaSoft/koishi-plugin-warframe/pull/115
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — all green (71 files, 624 tests)
- Outcome: Moved the riven cluster (`getAnalyzedRiven`, weekly rivens, static stats, OCR parse, disposition) from `wf-service/index.ts` into `wf-service.riven.ts`. Public imports stay on the services barrel. `getVoidTrader` remains in `index.ts` for L-025.
- Next: Previous type is optimize. No P1 explore remains, so pick P1 optimize L-025 (world-state boards). Split that item if the diff exceeds ~400 lines; skip `event` and `riven`, which are already extracted.

## 8 — 2026-09-10 — explore

- Item: L-005 `event` command for active world events from world-state Goals
- PR: https://github.com/CloudeaSoft/koishi-plugin-warframe/pull/114
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — all green (71 files, 623 tests)
- Outcome: Added `event` (`活动`, `事件`) showing active Goals with official Chinese names, progress/rewards, and remaining time. Parser `events` map to JSON `Goals`; community `Events` (Discord/wiki links) are not listed. The query lives in `wf-service.event.ts` instead of growing `index.ts`.
- Next: Previous type is explore, so pick P1 optimize L-024 (`wf-service.riven.ts`).

## 7 — 2026-09-09 — optimize

- Item: L-023 Scaffold `src/warframe/services/wf-service/` matching `wfm-service/`
- PR: https://github.com/CloudeaSoft/koishi-plugin-warframe/pull/113
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — all green (68 files, 609 tests)
- Outcome: Moved `wf-service.ts` to `wf-service/index.ts` and rewrote relative imports one directory deeper. Public `export * from './wf-service'` is unchanged. Meta tests now read the folder; `add-wf-command` tells new queries to land in `wf-service.<feature>.ts` instead of growing `index.ts`.
- Next: Previous type is optimize, so pick P1 explore L-005 (`event`). Next optimize after that is L-024 (`wf-service.riven.ts`).

## 6 — 2026-09-09 — explore

- Item: L-004 `1999calendar` command for the current 1999 Höllvania calendar week
- PR: https://github.com/CloudeaSoft/koishi-plugin-warframe/pull/112
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — all green (67 files, 601 tests)
- Outcome: Added `1999calendar` (`日历`, `1999日历`, `霍瓦尼亚日历`) showing remaining tagged 1999 days (challenges, Hex overrides, rewards) from `KnownCalendarSeasons` in official Chinese. Empty days are skipped; the world-state expiry is still a weekly window even though the day list covers the rest of the season.
- Next: Previous type is explore, so pick P1 optimize L-023 (scaffold `wf-service/`). Put new calendar queries in `wf-service.calendar.ts` after that extract.

## 5 — 2026-09-09 — optimize

- Item: L-021 Groom a split of `src/warframe/services/wf-service.ts`
- PR: https://github.com/CloudeaSoft/koishi-plugin-warframe/pull/111
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — all green (65 files, 588 tests)
- Outcome: Chose a `wf-service/` folder matching `wfm-service/`, with one module per command cluster and a barrel `index.ts` after extracts. Documented the export map in `docs/loop/wf-service-split.md` and locked it with `tests/meta/wfServiceSplit.spec.ts`. No service code moved.
- Next: Previous type is optimize, so pick a P1 explore (L-004 `calendar`). If that run lands after L-023, add `wf-service.calendar.ts` instead of growing `index.ts`. Next optimize after an explore is L-023 (folder scaffold).

## 4 — 2026-09-09 — fix

- Item: L-022 Rename `steelpath` command to `steel-essence` and drop Steel Path aliases
- PR: https://github.com/CloudeaSoft/koishi-plugin-warframe/pull/110
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — all green (64 files, 585 tests)
- Outcome: Command is now `steel-essence` (`钢铁精华`). Removed `steelpath`, `teshin`, `steel-path`, and `钢铁之路` so the Steel Essence shop is not confused with Steel Path fissures (`fissure-sp`). Shop methods and presentation types use steelEssence; the world-state field `steelPath` and `getSteelPathCatalogs` keep the upstream names.
- Next: Previous type is fix. P0 L-021 remains first (groom a `wf-service.ts` split, discuss file structure only). After that a P1 explore such as L-004 is next.

## 3 — 2026-09-09 — explore

- Item: L-003 `steelpath` command for Teshin's weekly Steel Path honors
- PR: (this change)
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — all green (63 files, 582 tests)
- Outcome: Added `steelpath` (`钢铁精华`, `钢铁之路`, `teshin`) showing the current Teshin honor, remaining time, and the rest of the 8-week rotation in Chinese from `warframe-worldstate-data`. The parser computes `steelPath` from a 2020-11-16 weekly epoch rather than a live JSON field; names are remapped from the English locale the plugin still passes to WorldState.build.
- Next: P0 L-021 is now first: groom a `wf-service.ts` split (discuss file structure only, do not move code). After that, previous type is explore so a P1 optimize such as L-006 is next.

## 2 — 2026-09-09 — grooming

- Item: withdraw L-002 from the loop (Chinese warframe nicknames, issue #69)
- PR: (this change)
- Validation: yarn build, yarn dtsc, yarn lint, yarn test — all green (61 files, 572 tests)
- Outcome: Nickname curation in `warframeAlias.json` belongs to public contributors, not loop engineering. L-002 is out of scope; selection rules skip community slang tables and issue #69. The unmerged alias branch is not loop work.
- Next: Last completed type is still optimize (L-001). Next selectable P1 explore is L-003 (`steelpath`).

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
