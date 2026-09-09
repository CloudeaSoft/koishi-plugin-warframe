# Loop backlog

Candidates for autonomous iterations. Each run picks the highest-priority
`todo` item (P0 first), skipping anything with an unresolved `blocked by`.
Status values: `todo`, `in-progress`, `done`, `dropped`.

Columns: **Type** is `explore` (new user-facing capability), `optimize`
(quality, maintainability, docs, tests), or `fix` (correct a shipped command,
alias, or user-facing naming). **Source** records where the idea came
from so future runs can judge how well-grounded it is.

## Candidates

| ID | P | Type | Item | Source | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| L-024 | P1 | optimize | Extract `wf-service.riven.ts` (OCR, stats, weekly rivens, disposition) from `wf-service/index.ts` | L-021 | todo | Largest cluster (~450 lines). Move only; keep public imports unchanged |
| L-025 | P1 | optimize | Extract world-state board modules: alert, invasion, nightwave, steel-essence, fissure, void-trader, environment, calendar | L-021 | todo | Split into two PRs if the diff exceeds ~400 lines |
| L-026 | P1 | optimize | Extract remaining wf-service modules: relic, arbitration, sortie, weekly+archon, bounty, circuit | L-021 | todo | Split into two PRs if the diff exceeds ~400 lines |
| L-005 | P1 | explore | `event` command: active world events / tactical alerts from world-state `events` with progress and rewards | unused world-state field | todo | Handle empty state with `event.unavailable` |
| L-006 | P1 | optimize | Factory + override injection for `globalWorldState.ts` (pattern from `globalItem.ts`) so world-state services can be tested with fixtures instead of parsed JSON | AGENTS.md maintenance notes | todo | Keep `overrideGlobal*` naming |
| L-007 | P1 | optimize | Factory + override injection for `globalRivenItem.ts` and `globalDucatnator.ts` | AGENTS.md maintenance notes | todo | Split into two PRs if the diff grows |
| L-008 | P1 | optimize | Turn IIFE-built static caches (`rivenDisposition`, `relics`, `rivenBaseValues`, `arbitrationSchedule`) into exported pure builders with unit tests | AGENTS.md maintenance notes | todo | One module per iteration |
| L-009 | P2 | explore | `vault-trader` command: Prime Resurgence (Varzia) inventory from world-state `vaultTrader`, with WFM median prices for the offered parts | unused world-state field | todo | Reuse WFM lookup from `relic` |
| L-010 | P2 | explore | Booster / double-resource notice from world-state `globalUpgrades`, either as a command or appended to `environment` output | unused world-state field | todo | Check how often the field is non-empty |
| L-011 | P2 | explore | Kuva siphon / flood nodes from world-state `kuva` | unused world-state field | todo | Confirm the upstream field is still populated |
| L-012 | P2 | explore | Prime set price ranking from WFM (TODO.md item 4) | TODO.md | todo | Needs a definition of "set" from `warframe-public-export-plus` |
| L-013 | P2 | explore | Show WFM prices next to Baro Ki'Teer items in `void-trader` (TODO.md item 3) | TODO.md | todo | Only for tradable items |
| L-014 | P2 | explore | Kuva / Tenet / Coda weapon lookups behind the `lich-c` / `lich-i` placeholders (TODO.md item 1) | TODO.md, README placeholders | todo | Large; groom into smaller items first |
| L-015 | P2 | optimize | Decide the fate of unused exports `relicQualityToName` and `relicQualityToTransKey` (use them in `relic` output or remove) | AGENTS.md maintenance notes | todo | |
| L-016 | P2 | optimize | Retire the deprecated `wm` command or make it a thin alias of `wmi`, then update README | README deprecation note | todo | Confirm no schedule or hook depends on it |
| L-017 | P2 | optimize | Raise the vitest `functions` coverage threshold in steps once coverage gaps in `src/warframe/services` are closed | vitest.config.ts | todo | Measure with `yarn vitest run --coverage` first |
| L-018 | P2 | explore | Clarify TODO.md item 2 ("wfm alias") into a concrete design (per-user aliases vs. item name aliases) | TODO.md | todo | Grooming only; do not extend `warframeAlias.json` |
| L-019 | P2 | optimize | Align README Develop setup with CONTRIBUTING: Corepack Yarn 4 instead of `npm i -g yarn` | found while doing L-001 | todo | README still documents Yarn 1 global install |
| L-020 | P2 | optimize | Add README command rows for `alert`, `invasion`, `nightwave`, and `sortie` (already shipped, tables still omit them) | found while doing L-003 | todo | Keep the Weekly & Activities / Alerts grouping consistent |

## Out of loop scope (maintainer decisions)

Items the loop must not act on because they touch CI, release, or dependencies:

- `.github/workflows/build-and-test.yml` pins `actions/checkout@v3` and
  `actions/setup-node@v3` while `release.yml` uses `@v6`.
- `koishi-plugin-cron` is pinned exactly (`3.1.0`) in `peerDependencies` but
  ranged in `devDependencies`.

Items the loop must not act on because they belong to public contributors:

- L-002 / GitHub issue #69: Chinese warframe nicknames and other slang in
  `src/warframe/assets/warframeAlias.json`. Community 黑话 is curated by
  people who play the game; the loop must not invent, scrape, or bulk-edit
  that table.

## Done

| ID | Type | Item | PR |
| --- | --- | --- | --- |
| L-023 | optimize | Scaffold `src/warframe/services/wf-service/` by moving `wf-service.ts` to `wf-service/index.ts` | (this change) |
| L-004 | explore | `1999calendar` command: current 1999 Höllvania calendar week | [#112](https://github.com/CloudeaSoft/koishi-plugin-warframe/pull/112) |
| L-021 | optimize | Groom a split of `wf-service.ts`: folder matching `wfm-service/`, per-cluster modules, follow-ups L-023–L-026 | [#111](https://github.com/CloudeaSoft/koishi-plugin-warframe/pull/111) |
| L-022 | fix | Rename `steelpath` command to `steel-essence`; drop aliases `steelpath`, `teshin`, `steel-path`, `钢铁之路`; rename shop methods from steelPath to steelEssence | [#110](https://github.com/CloudeaSoft/koishi-plugin-warframe/pull/110) |
| L-003 | explore | `steelpath` command: Teshin's weekly Steel Path honors rotation (renamed to `steel-essence` in L-022) | [#109](https://github.com/CloudeaSoft/koishi-plugin-warframe/pull/109) |
| L-001 | optimize | Align `CONTRIBUTING.md` with `src/warframe/*` layers, `src/warframe/utils/http.ts`, `WarframeResult<T>`, vitest/lint commands; drop the missing `docs/architecture.md` link | [#105](https://github.com/CloudeaSoft/koishi-plugin-warframe/pull/105) |
