# AGENTS.md

This file provides guidance to AI assistants (opencode, Cursor, Copilot, etc.) working in this codebase.

## Project Overview

**koishi-plugin-warframe** — A Warframe toolkit plugin for the Koishi chatbot framework. Provides Warframe Market prices, fissures, arbitrations, relics, weekly missions, open world cycles, riven analysis (OCR), and void trader info.

## Tech Stack

- **Language**: TypeScript (target: es2022, module: esnext, JSX: react-jsx via @satorijs/element)
- **Runtime**: Node.js (>=18, tested on v24)
- **Framework**: Koishi v4 (`koishi`, `@koishijs/plugin-help`, `@koishijs/plugin-mock`)
- **Package Manager**: **yarn** (Yarn 4 with PnP-compatible workspace). Always use `yarn` commands, never `npm`.
- **Build**: `yakumo` (dtsc for type-checking, esbuild for bundling)
- **Test**: `mocha` + `chai` (no `chai-as-promised`; use try/catch for rejected-promise assertions)
- **Key Dependencies**: `ofetch` (HTTP), `warframe-public-export-plus` (game data), `warframe-worldstate-parser` (live game state), `tencentcloud-sdk-nodejs-ocr` (OCR)

## Common Commands

```bash
yarn dtsc          # Type-check (no emit; uses dtsc)
yarn test          # Run all tests (mocha + esbuild-register)
yarn build         # Full build (yakumo)
yarn install       # Install dependencies
```

To run a single test file:
```bash
yarn mocha tests/<file>.spec.ts
```

## Architecture

The project follows a **domain-driven layered architecture**. Three domains: `wf` (Warframe game state), `wfm` (Warframe Market), `miscs` (miscellaneous APIs). Each layer is split by domain.

```
src/
├── index.ts              # Plugin entry: apply(ctx) registers commands & hooks
├── commands/             # Command handlers (thin: service → component → render)
│   ├── wf.ts wfm.ts miscs.ts
├── components/           # JSX → koishi Element renderers + Puppeteer output
│   ├── wf.tsx wfm.tsx miscs.tsx render.tsx
├── services/             # Business logic (pure functions + data orchestration)
│   ├── wf-service.ts wfm-service.ts
├── data/                 # Cached data singletons (createAsyncCache wrappers)
│   ├── wf/ wfm/ miscs/
├── infrastructure/       # External API clients & data adapters
│   ├── wf/ wfm/ miscs/ ocr-api.ts
├── utils/                # Generic, domain-agnostic primitives
│   ├── cache.ts collection.ts color.ts http.ts logger.ts text.ts time.ts
├── types/                # Ambient .d.ts type declarations (no runtime)
├── hooks/                # Lifecycle hooks (on-ready)
└── assets/               # Static data (JSON, TS string constants)
```

### Layer Dependencies (strict, one-directional)

```
commands → services → data → infrastructure → utils
       └→ components ──┘
```

- **utils/** must not import from any other layer (except `logger.ts` which imports `koishi`).
- **infrastructure/** may import from utils only.
- **data/** may import from infrastructure + utils.
- **services/** may import from data + infrastructure + utils + assets + types (not components).
- **commands/** may import from services + components + utils.
- **components/** may import from utils + types only (not from services/data/infrastructure).

### Domain Adapters

`infrastructure/wf/` contains two adapter modules that transform data from external packages:
- `wf-export-adapter.ts` — adapts `warframe-public-export-plus` (relics, regions, qualities)
- `wfcd-adapter.ts` — adapts `warframe-worldstate-data` (sol nodes, mission types, void trader items, fissure tiers). Also contains `relicToFullNameZH` (merged from former `translation.ts`).

## Code Conventions

### Logging
- Use the **single global logger**: `import { logger } from "./utils"` (or relative path).
- Scope is `"koishi-plugin-warframe"` — defined in `src/utils/logger.ts`.
- **Never** use `console.log`/`console.error` — always use `logger`.
- `Logger` is a stateless static class (koishi core pattern); safe to instantiate at module scope without ctx.

### HTTP Requests
- Use `fetchAsyncText` / `fetchAsyncData<T>` / `fetchAsyncImage` from `src/utils/http.ts`.
- All three wrap a shared `request()` core with: ofetch, 10s timeout, 3 retries (500ms backoff, retry on 408/429/500/502/503/504), realistic browser headers, `Language: zh-hans`.
- **Error contract**: any failure → `logger.error(...)` → `return undefined`. Callers handle `T | undefined`.
- **Never** use raw `fetch()` or `ofetch()` directly.

### Caching
- `createAsyncCache(factory, ttlMs)` — TTL-based async cache with in-flight deduplication. Use `-1` for infinite TTL.
- `CacheStorage<T>(limit)` — LRU Map-backed promise cache (used by OCR).
- Data layer singletons use `createAsyncCache` with appropriate TTLs.
- **Factory + override pattern**: `globalItem.ts` and `globalRivenAttribute.ts` expose `*Factory(data?)` + `overrideGlobal*(cache)` pairs for test injection. Follow this pattern when adding new data singletons.

### TypeScript
- Type declarations live in `src/types/` as ambient `.d.ts` files (global types, no import needed).
- Domain types are organized: `types/wf/`, `types/wfm/`, `types/miscs/`.
- Use `declare module` for extending external interfaces when needed.

### JSX / Components
- Components produce `Element` from `@satorijs/element` (via `koishi`).
- `.tsx` files use `jsxImportSource: "@satorijs/element"`.
- `render.tsx` handles Puppeteer rendering: `generateImageOutput(puppe, element)`.
- Pure helper functions inside components should be extracted for testability when they contain non-trivial logic.

### Testing
- Test files in `tests/`, named `<feature>.<domain>.spec.ts` or `<module>.utils.spec.ts`.
- Use `chai` `expect()` style assertions.
- For async tests needing network, set `this.timeout(...)` appropriately.
- **Test isolation**: put `before()`/`after()` hooks **inside** `describe()` blocks, never at file root — mocha runs root-level hooks before ALL test files, causing cross-file interference.
- Use `overrideGlobal*` functions to inject fixture data (avoid live network in unit tests).
- Fixture JSON files go in `tests/assets/`.

### Error Handling
- Service functions return `string` for user-facing error messages (Chinese), or the data type on success.
- Infrastructure functions return `T | undefined` (undefined = failure, logged internally).
- Never throw from infrastructure/utils — catch, log, return undefined.

## File Organization Rules

- **utils/**: only generic, domain-agnostic primitives. If it imports a Warframe-specific package, it belongs in `infrastructure/`.
- **infrastructure/**: external service clients and data adapters. One file per external API.
- **data/**: cached singletons wrapping infrastructure calls. Each file exports a `createAsyncCache` instance.
- **services/**: business logic. Pure functions when possible; orchestrate data + infrastructure.
- **commands/**: thin handlers. Call service → branch on result → render component. No business logic.
- **components/**: JSX renderers. Transform data → Element. Pure helpers can be extracted.

## Known Issues & Technical Debt

- `relicQualityToName` and `relicQualityToTransKey` in `wf-export-adapter.ts` have no external callers — possible dead code.
- `globalRivenItem.ts`, `globalDucatnator.ts`, `globalWorldState.ts` lack the factory+override pattern — harder to unit test.
- Several IIFE-built statics in `data/wf/` (`rivenDisposition`, `relics`, `rivenBaseValues`, `arbitrationSchedule`) have no injection seam — their transform logic is inlined.
- `lichc` / `lichi` commands are stubs ("功能暂未开放").
