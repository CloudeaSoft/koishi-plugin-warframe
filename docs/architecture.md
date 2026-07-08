# Architecture Reference

This document is for project contributors. It details the architecture design, data flow, and development conventions of koishi-plugin-warframe.

## 1. Overall Architecture

### 1.1 Design Philosophy

This project follows a **domain-driven + layered architecture**. Core principles:

- **Domain partitioning**: Code is split by business domain into `wf` (Warframe game state), `wfm` (Warframe Market), and `miscs` (miscellaneous external APIs). Each domain evolves independently with no coupling between domains.
- **Layer isolation**: Each layer has clear responsibilities, with strictly one-directional dependencies flowing downward. Upper layers may call lower layers; lower layers must not call upper layers.
- **Thin controllers**: The command layer (`commands/`) only dispatches — it contains no business logic. All logic lives in the service layer.

### 1.2 Layer Relationships

```
┌─────────────────────────────────────────────────┐
│  commands/          thin handlers, dispatch     │
│    ├── wf.ts  wfm.ts  miscs.ts                  │
├──────────────┬──────────────────────────────────┤
│  services/   │  components/   business & view    │
│  (pure fns)  │  (JSX render)                     │
├──────────────┴──────────────────────────────────┤
│  data/              cached data singletons       │
│    ├── wf/  wfm/  miscs/                         │
├─────────────────────────────────────────────────┤
│  infrastructure/    external API clients        │
│    ├── wf/  wfm/  miscs/  ocr-api.ts            │
├─────────────────────────────────────────────────┤
│  utils/             generic primitives           │
│    ├── cache collection color http logger        │
│    ├── text time                                 │
├─────────────────────────────────────────────────┤
│  types/             type declarations (no code)  │
└─────────────────────────────────────────────────┘
```

`services/` and `components/` are **sibling layers** — neither depends on the other. Only `commands/` calls into both: service fetches data → component renders.

**Dependency rules (strictly one-directional)**:

- `utils/` → depends on no other layer (`logger.ts` importing `koishi` is the exception)
- `infrastructure/` → depends on `utils/` only
- `data/` → depends on `infrastructure/` + `utils/`
- `services/` → depends on `data/` + `infrastructure/` + `utils/` + `assets/` + `types/` (**not components**)
- `components/` → depends on `utils/` + `types/` only (not services/data/infrastructure)
- `commands/` → depends on `services/` + `components/` + `utils/`

### 1.3 Directory Structure

```
src/
├── index.ts                  # Plugin entry: apply(ctx) registers commands & hooks
├── commands/                 # Command handlers (thin dispatch layer)
│   ├── index.ts              #   re-export barrel
│   ├── wf.ts                 #   Warframe game commands
│   ├── wfm.ts                #   Warframe Market commands
│   └── miscs.ts              #   Misc commands
├── components/               # JSX → koishi Element renderers
│   ├── render.tsx            #   Puppeteer image output (generateImageOutput)
│   ├── wf.tsx                #   Warframe game components
│   ├── wfm.tsx               #   Warframe Market components
│   └── miscs.tsx             #   Misc components
├── services/                 # Business logic (pure functions + data orchestration)
│   ├── index.ts              #   re-export barrel
│   ├── wf-service.ts         #   Warframe game service
│   └── wfm-service.ts        #   Warframe Market service
├── data/                     # Cached data singletons (createAsyncCache wrappers)
│   ├── wf/                   #   Warframe game data
│   │   ├── globalWorldState.ts    #   world state (fissures/trader/cycles)
│   │   ├── relics.ts              #   relic data table
│   │   ├── arbitrationSchedule.ts #   arbitration schedule
│   │   ├── rivenBaseValues.ts     #   riven attribute base values
│   │   ├── rivenDisposition.ts   #   riven disposition table
│   │   └── rivenStatData.ts       #   riven stat fix factors
│   ├── wfm/                  #   Warframe Market data
│   │   ├── globalItem.ts          #   item list (with factory+override)
│   │   ├── globalRivenItem.ts     #   riven weapon list
│   │   ├── globalRivenAttribute.ts#   riven attribute list (with factory+override)
│   │   └── globalDucatnator.ts    #   ducat prices
│   └── miscs/               #   Misc data
│       └── lab.ts            #   trending riven ranking
├── infrastructure/           # External API clients & data adapters
│   ├── ocr-api.ts            #   Tencent Cloud OCR client
│   ├── wf/                   #   Warframe game adapters
│   │   ├── wf-api.ts              #   world state API + Baro Lua parser
│   │   ├── wf-export-adapter.ts    #   warframe-public-export-plus adapter
│   │   └── wfcd-adapter.ts         #   warframe-worldstate-data adapter
│   ├── wfm/                  #   Warframe Market adapters
│   │   ├── wfm-api.ts             #   WFM REST API client
│   │   └── dto/                   #   data transfer objects
│   └── miscs/               #   Misc APIs
│       └── lab-api.ts       #   RivenTracker API
├── utils/                   # Generic primitives
│   ├── index.ts              #   re-export barrel
│   ├── logger.ts             #   global Logger instance
│   ├── cache.ts              #   createAsyncCache + CacheStorage
│   ├── http.ts               #   fetchAsyncText/Data/Image (ofetch)
│   ├── text.ts               #   string processing + similarity
│   ├── time.ts               #   time conversion
│   ├── color.ts              #   color interpolation
│   └── collection.ts         #   collection transforms
├── types/                   # Type declarations (.d.ts, no runtime code)
│   ├── cache.d.ts            #   AsyncCache interface
│   ├── config.d.ts           #   OcrAPISecret interface
│   ├── wf/                   #   Warframe domain types
│   ├── wfm/                  #   Warframe Market domain types
│   └── miscs/                #   Misc domain types
├── hooks/                   # Lifecycle hooks
│   └── on-ready.ts           #   ready event handler
└── assets/                  # Static data
    ├── baro.ts               #   void trader history (Lua table string)
    ├── arbys.ts              #   arbitration schedule (CSV string)
    ├── arbyRewards.ts        #   arbitration reward map
    ├── circuitRewards.json   #   circuit rewards table
    ├── rivenAttrValues.json  #   riven attribute caps
    ├── rivencalc.json        #   riven weapon calc data
    ├── zh.json               #   Chinese translation dict
    └── en.json               #   English translation dict
```

## 2. Data Flow

### 2.1 Typical Command Execution Flow

Using the `relic 古纪A1` command as an example:

```
User input "relic 古纪A1"
    │
    ▼
commands/wf.ts: relicCommand(action, input)
    │  calls service
    ▼
services/wf-service.ts: getRelic("古纪A1")
    │  reads local data (IIFE-built static dict)
    ▼
data/wf/relics.ts: relics["litha1"]
    │  depends on warframe-public-export-plus package data
    │  depends on infrastructure/wf/wf-export-adapter.ts: fixRelicRewardKey()
    │
    │  returns Relic object
    ▼
services/wf-service.ts: applyRelicData(relic)
    │  enriches with WFM prices + ducat values
    │  calls data/wfm/globalItem.ts and globalDucatnator.ts
    │
    │  returns OutputRelic object
    ▼
components/wf.tsx: RelicComponent(outputRelic)
    │  transforms to koishi Element (JSX)
    │
    ▼
components/render.tsx: generateImageOutput(puppe, element)
    │  Puppeteer renders to image
    │
    ▼
returns image to user
```

### 2.2 Cache Data Flow

The data layer wraps external API calls in `createAsyncCache`, providing TTL caching + concurrent request deduplication:

```
First call to globalWorldState.get()
    │
    ▼
createAsyncCache: check cache
    │  cache empty or expired
    ▼
factory function executes:
    │  calls infrastructure/wf/wf-api.ts: getWorldState()
    │      └─ utils/http.ts: fetchAsyncText()  ← ofetch + retry
    │  calls infrastructure/wf/wfcd-adapter.ts: getSolNodeKey()
    │  calls infrastructure/wf/wf-export-adapter.ts: regionToShort()
    │  builds Fissure/Arbitration data structures
    │
    │  stores in cache, returns data
    ▼
Subsequent calls to globalWorldState.get()
    │  cache not expired → returns cached value (no network request)
    │  cache expired → re-executes factory
    │  concurrent calls → deduplicated, share the same in-flight Promise
```

### 2.3 Factory + Override Pattern

`globalItem.ts` and `globalRivenAttribute.ts` use this pattern for testability:

```typescript
// data/wfm/globalItem.ts

// Factory: accepts optional injected data; falls back to network when omitted
export async function globalItemDataFactory(response?: ItemShort[]) {
  response ??= await getWFMItemList() // network call
  if (!response)
    return { /* empty structures */ }
  // builds 4 dicts...
}

// Default cache instance (infinite TTL)
export const globalItemData = createAsyncCache(globalItemDataFactory, -1)

// Override: inject fixture data during tests
export function overrideGlobalItemData(cache) {
  globalItemData = cache
}
```

Usage in tests:

```typescript
before(() => {
  overrideGlobalItemData(
    createAsyncCache(async () => {
      return await globalItemDataFactory(fixtureData)
    }, -1)
  )
})
```

## 3. Layer Details

### 3.1 utils/ — Generic Primitives

| File | Exports | Description |
|---|---|---|
| `logger.ts` | `logger` | Global Logger instance, scope: `"koishi-plugin-warframe"` |
| `cache.ts` | `createAsyncCache`, `CacheStorage` | TTL async cache + LRU storage |
| `http.ts` | `fetchAsyncText`, `fetchAsyncData<T>`, `fetchAsyncImage` | ofetch wrapper, 10s timeout, 3 retries |
| `text.ts` | `normalizeName`, `fullWidthToHalfWidth`, `removeSpace`, `toPascalCase`, `normalSimilarity`, `tokenSimilarity` | String normalization + similarity calculation |
| `time.ts` | `toTimeStamp`, `msToHumanReadable`, `sleep` | Time conversion |
| `color.ts` | `lerp`, `hexToRgb`, `rgbToHex` | Color interpolation |
| `collection.ts` | `listToDict`, `listToDictSpec`, `dictToKeyDict` | Collection transforms |

### 3.2 infrastructure/ — External API Clients

| File | External Dependency | Description |
|---|---|---|
| `ocr-api.ts` | `tencentcloud-sdk-nodejs-ocr` | Tencent Cloud OCR, with SHA-256 hash cache |
| `wf/wf-api.ts` | `warframe-worldstate-parser` | World state fetch + Baro Lua table parser |
| `wf/wf-export-adapter.ts` | `warframe-public-export-plus` | Relic quality/era conversion, region mapping, reward key fix |
| `wf/wfcd-adapter.ts` | `warframe-worldstate-data` | Sol Node mapping, mission type mapping, fissure tiers, void trader items |
| `wfm/wfm-api.ts` | Warframe Market REST API | Item/order/riven/ducat queries |
| `miscs/lab-api.ts` | lab.webutilitykit.com | Trending riven ranking |

### 3.3 data/ — Cached Data Singletons

Each file exports a `createAsyncCache` instance with a TTL appropriate to the data's update frequency:

| File | TTL | Data Source | Factory+Override |
|---|---|---|---|
| `wf/globalWorldState.ts` | 2 min | wf-api + adapters | No |
| `wf/relics.ts` | infinite (IIFE) | warframe-public-export-plus | No |
| `wf/arbitrationSchedule.ts` | infinite (IIFE) | local assets/arbys.ts | No |
| `wf/rivenBaseValues.ts` | infinite (IIFE) | local rivenAttrValues.json | No |
| `wf/rivenDisposition.ts` | infinite (IIFE) | warframe-public-export-plus + rivencalc.json | No |
| `wf/rivenStatData.ts` | static const | none | — |
| `wfm/globalItem.ts` | infinite | wfm-api | **Yes** |
| `wfm/globalRivenItem.ts` | infinite | wfm-api | No |
| `wfm/globalRivenAttribute.ts` | infinite | wfm-api | **Yes** |
| `wfm/globalDucatnator.ts` | 1 hour | wfm-api | No |
| `miscs/lab.ts` | 30 min | lab-api | No |

### 3.4 services/ — Business Logic

| Function | Input | Output | Dependencies |
|---|---|---|---|
| `getRelic` | relic name | `Relic` or error string | relics data dict |
| `getArbitrations` | day count | `Arbitration[]` or error string | arbitrationSchedule + ExportRegions |
| `getCircuitWeek` | none | circuit rewards | circuitRewards.json + dict_zh |
| `getWeekly` | none | weekly missions | globalWorldState + getMissionTypeKey |
| `getEnvironment` | none | open world state | globalWorldState |
| `getFissures` | none | fissure list | globalWorldState |
| `getVoidTrader` | none | void trader | globalWorldState + getVoidTraderItem |
| `getAnalyzedRiven` | OCR secret + image URL | riven analysis result | fetchAsyncImage + ocr-api + parseOCRResult |
| `getStaticRivenStats` | weapon type + stat type + disposition | riven stat ranges | rivenAttrValueDict + globalRivenAttribute |
| `getWeaponRivenDisposition` | weapon name | disposition data | weaponRivenDispositionDict |
| `parseOCRResult` | OCR text lines | parsed result | globalRivenAttribute |
| `analyzeRivenStat` | parsed result | analysis result | rivenAttrValueDict + rivenStatFixFactor |
| `stringToWFMItem` | user input | WFM item | globalItemData |
| `getItemOrders` | user input | order list | stringToWFMItem + wfm-api |
| `getRivenOrders` | user input | riven order list | globalRivenItemData + wfm-api |
| `applyRelicData` | relic object | enriched relic | globalItemData + globalDucatnatorIDDict |

### 3.5 components/ — JSX Rendering

Components use `@satorijs/element` JSX syntax to produce `Element`, ultimately rendered to images via `generateImageOutput` with Puppeteer.

`render.tsx` contains ~600 lines of static CSS theme + SVG icon library (sourced from the Warframe Market frontend), along with HTML template assembly logic.

### 3.6 commands/ — Command Handlers

Each command function receives `action: Argv` (koishi command context), calls a service to fetch data, and branches on the result (success → render image, failure → return error text).

## 4. Testing

### 4.1 Test File Organization

Test files live in `tests/`, named `<feature>.<domain>.spec.ts` (domain tests) or `<module>.utils.spec.ts` (utility tests).

### 4.2 Test Categories

| Category | Example Files | Description |
|---|---|---|
| Pure function tests | `cache.utils.spec.ts`, `color.utils.spec.ts` | Zero dependencies, direct assertions |
| Data factory tests | `globalItem.data.spec.ts` | Fixture data injection |
| Parser tests | `baro-parser.wf.spec.ts` | Pass in string, verify parse result |
| Service tests | `relic.wf.spec.ts`, `staticRivenStats.wf.spec.ts` | Depends on data packages + fixture injection |
| Integration tests | `voidtrader.wf.spec.ts`, `wiki.wm.spec.ts` | Involves external data packages |

### 4.3 Test Isolation Convention

**Critical**: `before()` / `after()` hooks MUST be placed inside `describe()` blocks. Placing them at the file root causes mocha to run them before ALL test files in the suite, resulting in cross-file interference.

## 5. Development Guide

### 5.1 Adding a New Command

1. Implement the business logic function in `services/`
2. Implement the render component in `components/` (if image output is needed)
3. Add the command handler in `commands/` (call service → branch → render)
4. Register the command in `setupCommands()` within `src/index.ts`

### 5.2 Adding a New External API

1. Add an API client file in `infrastructure/<domain>/`
2. Use `fetchAsyncText` / `fetchAsyncData` / `fetchAsyncImage` for requests
3. Add a `createAsyncCache` wrapper in `data/<domain>/`
4. If testability is needed, implement the factory + override pattern

### 5.3 Adding a New Data Adapter

1. Add the adapter file in `infrastructure/`
2. Only depend on `utils/` — no other layers
3. Export pure transformation functions

### 5.4 Logging

```typescript
import { logger } from '../utils' // or relative path

logger.info('message')
logger.warn('warning')
logger.error('error')
```

**Never** use `console.log` / `console.error`.

### 5.5 HTTP Requests

```typescript
import { fetchAsyncData } from '../utils'

const data = await fetchAsyncData<MyType>('https://api.example.com/data')
if (!data) {
  return '获取数据失败' // handle undefined
}
```

**Never** use raw `fetch()` or `ofetch()` directly.

## 6. Technical Debt & Improvement Directions

| Issue | Impact | Suggestion |
|---|---|---|
| `globalRivenItem.ts` lacks factory+override | Cannot inject test data | Mirror `globalItem.ts` pattern |
| `globalWorldState.ts` lacks factory+override | Hard to unit test | Extract `mapFissure()` pure function |
| IIFE static dicts have no injection seam | Transform logic inlined | Extract into `buildXxx(data)` pure functions |
| `relicQualityToName` / `relicQualityToTransKey` have no callers | Possible dead code | Confirm and remove |
| `lichc` / `lichi` commands are stubs | Feature not implemented | Implement or remove |
