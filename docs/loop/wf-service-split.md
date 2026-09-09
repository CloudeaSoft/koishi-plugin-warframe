# `wf-service.ts` split

Groomed in L-021. Do not move code in that iteration; implement via L-023
through L-026. This file is the layout contract: `tests/meta/wfServiceSplit.spec.ts`
fails if a new `export function` is added without a row here.

## Decision

Use a **folder matching `wfm-service/`**, with **one module per command
cluster**, not one file per command and not a few giant domain buckets.

Rejected alternatives:

- **Per-command files only.** `getFissures` / `getNightwave` / `getVoidTrader`
  are a handful of lines each. Fourteen extra barrels for those is noise, and
  extracting one command per PR would take too many iterations.
- **Three domain buckets** (world-state / weekly / riven). That would leave
  `weekly.ts` mixing sortie, archon hunt, and Archimedea, which is how the
  monolith grew. Tests and `add-wf-command` already think per feature.

`wfm-service/` extracted *helpers* and kept feature functions in `index.ts`.
`wf-service.ts` is the opposite problem: the feature functions *are* the bulk
(~1450 lines). So the folder shape matches `wfm-service/`, but `index.ts`
becomes a barrel after the extracts rather than holding `get*` itself.

## Target tree

```text
src/warframe/services/wf-service/
|-- index.ts                       # re-export public API only (after extracts)
|-- wf-service.relic.ts
|-- wf-service.arbitration.ts
|-- wf-service.sortie.ts
|-- wf-service.weekly.ts           # getWeekly + adaptArchonHunt
|-- wf-service.nightwave.ts
|-- wf-service.environment.ts
|-- wf-service.bounty.ts
|-- wf-service.circuit.ts
|-- wf-service.invasion.ts
|-- wf-service.alert.ts
|-- wf-service.steel-essence.ts
|-- wf-service.fissure.ts          # normal / steel-path / railjack
|-- wf-service.void-trader.ts
`-- wf-service.riven.ts            # OCR, stats, weekly rivens, disposition
```

`src/warframe/services/index.ts` keeps `export * from './wf-service'`. Koishi
commands stay on `from '../warframe'`. Tests stay on `from '.../services'`
unless they already import a helper file.

`world-state-refresh.ts` and `miscs-service.ts` stay where they are.

## Rules for extract PRs

- Move code only. No behaviour, i18n, or command changes.
- Feature modules must not import each other. Shared work stays in
  `data/`, `infrastructure/`, or `utils/`.
- Keep `adapt*` / `get*From` next to their `get*` (existing test seams).
- File-private helpers stay unexported in the same module (`mongoDateMs` with
  sortie, invasion tone helpers with invasion, steel-essence week math with
  steel-essence).
- After L-023, new world-state queries go in `wf-service.<feature>.ts` and are
  re-exported from `index.ts`. Do not grow `index.ts` again.
- Update `tests/meta/assetsBoundary.spec.ts` to read the module that imports
  the asset (or to scan the folder) when that import leaves `index.ts`.
- Split an extract item into two PRs if the diff is likely over ~400 lines
  excluding this document.

## Implement order

1. **L-023** — `git mv` `wf-service.ts` → `wf-service/index.ts`. Path updates
   only (`assetsBoundary`, this spec, `add-wf-command`).
2. **L-024** — extract `wf-service.riven.ts` first (largest cluster).
3. **L-025** — extract world-state boards (alert, invasion, nightwave,
   steel-essence, fissure, void-trader, environment).
4. **L-026** — extract the rest (relic, arbitration, sortie, weekly, bounty,
   circuit).

## Export map

Every `export function` in `wf-service.ts` (or later `wf-service/`) must appear
here.

| Export | Target file |
| --- | --- |
| `getRelic` | `wf-service.relic.ts` |
| `getArbitrations` | `wf-service.arbitration.ts` |
| `adaptArchonHunt` | `wf-service.weekly.ts` |
| `adaptSortie` | `wf-service.sortie.ts` |
| `getSortieFrom` | `wf-service.sortie.ts` |
| `getSortie` | `wf-service.sortie.ts` |
| `getWeekly` | `wf-service.weekly.ts` |
| `resolveNightwave` | `wf-service.nightwave.ts` |
| `getNightwave` | `wf-service.nightwave.ts` |
| `getEnvironment` | `wf-service.environment.ts` |
| `getBounty` | `wf-service.bounty.ts` |
| `getCircuitWeek` | `wf-service.circuit.ts` |
| `adaptInvasions` | `wf-service.invasion.ts` |
| `getInvasionsFrom` | `wf-service.invasion.ts` |
| `getInvasions` | `wf-service.invasion.ts` |
| `adaptAlerts` | `wf-service.alert.ts` |
| `getAlerts` | `wf-service.alert.ts` |
| `adaptSteelEssence` | `wf-service.steel-essence.ts` |
| `getSteelEssenceFrom` | `wf-service.steel-essence.ts` |
| `getSteelEssence` | `wf-service.steel-essence.ts` |
| `getFissures` | `wf-service.fissure.ts` |
| `getSteelPathFissures` | `wf-service.fissure.ts` |
| `getRailjackFissures` | `wf-service.fissure.ts` |
| `getAnalyzedRiven` | `wf-service.riven.ts` |
| `getVoidTrader` | `wf-service.void-trader.ts` |
| `filterWeeklyRivens` | `wf-service.riven.ts` |
| `getWeeklyRivens` | `wf-service.riven.ts` |
| `getStaticRivenStats` | `wf-service.riven.ts` |
| `getWeaponRivenDisposition` | `wf-service.riven.ts` |
| `parseOCRResult` | `wf-service.riven.ts` |
| `analyzeRivenStat` | `wf-service.riven.ts` |
