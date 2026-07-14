# AGENTS.md

Guidance for AI assistants working in this package.

## Project Snapshot

`koishi-plugin-warframe` is a Koishi v4 plugin that provides Warframe toolkit commands:
Warframe Market prices, fissures, arbitrations, relics, weekly missions, open-world
cycles, Riven analysis/OCR, and Void Trader information.

## Environment And Commands

- Language: TypeScript, target `es2022`, module `esnext`.
- JSX: `react-jsx` with `jsxImportSource: "@satorijs/element"`.
- Runtime: Node.js >= 18.
- Framework: Koishi v4 with `@satorijs/element` JSX output and Puppeteer image
  rendering.
- Package manager: Yarn. Use `yarn` commands only; do not run `npm` or `npx`
  directly. If a script internally uses another tool, run it through `yarn <script>`.
- On Windows, prefer `pwsh` (PowerShell 7) for shell commands. Do not use
  legacy `powershell.exe` unless a command explicitly requires it.
- Build system: `yakumo` with `yakumo-tsc` and `yakumo-esbuild`.
- Test stack: Mocha + Chai. Do not add `chai-as-promised`; use explicit
  `try`/`catch` assertions for rejected promises.

Common commands:

```bash
yarn dtsc          # type-check declarations
yarn test          # run all tests
yarn build         # full yakumo build
yarn lint          # eslint, including markdown
yarn install       # install dependencies from the workspace setup
```

Run one test file with:

```bash
yarn mocha tests/<file>.spec.ts
```

Repository rule: do not create a package-local `yarn.lock`. This package is part
of a Koishi/Yarn workspace where lockfiles are managed at the workspace root.

## Architecture

The code is organized by domain and layer. The main domains are:

- `wf`: Warframe game state and static game data.
- `wfm`: Warframe Market data.
- `miscs`: miscellaneous external APIs.

High-level layout:

```text
src/
|-- index.ts              # plugin entry; registers commands and hooks
|-- commands/             # thin Koishi command handlers
|-- components/           # JSX -> Koishi Element renderers and Puppeteer output
|-- services/             # business logic and data orchestration
|-- data/                 # cached data singletons
|-- infrastructure/       # external API clients and package adapters
|-- utils/                # generic primitives
|-- types/                # ambient/domain type declarations
|-- hooks/                # lifecycle hooks
`-- assets/               # static JSON and TS data
```

Layer direction is one-way:

```text
commands -> services -> data -> infrastructure -> utils
commands -> components -> utils
```

Dependency rules:

- `utils/` must stay generic and domain-agnostic. The exception is
  `utils/logger.ts`, which imports Koishi.
- `infrastructure/` may import from `utils/`.
- `data/` may import from `infrastructure/` and `utils/`.
- `services/` may import from `data/`, `infrastructure/`, `utils/`, `assets/`,
  and `types/`. It must not import from `components/`.
- `commands/` may import from `services/`, `components/`, and `utils/`.
- `components/` may import from `utils/` and `types/` only. It must not import
  from `services/`, `data/`, or `infrastructure/`.

## Layer Responsibilities

- Commands: parse command input, call services, branch on service results, and
  render component output. Keep business logic out of command files.
- Services: implement user-facing behavior. Prefer pure helpers for transforms
  and keep external-data orchestration explicit.
- Data: expose cache-backed singletons around infrastructure calls. Use
  `createAsyncCache()` and keep test injection seams when practical.
- Infrastructure: isolate external services, HTTP clients, and third-party data
  adapters.
- Components: transform service data into `Element` output. Extract non-trivial
  formatting helpers when they need focused tests.
- Utils: reusable primitives only. If a utility imports Warframe-specific data
  or packages, it belongs outside `utils/`.

## Important Modules

- `src/infrastructure/wf/wf-export-adapter.ts` adapts
  `warframe-public-export-plus` data such as relics, regions, and relic quality.
- `src/infrastructure/wf/wfcd-adapter.ts` adapts `warframe-worldstate-data`
  values such as nodes, mission types, fissure tiers, and Void Trader items.
  It also owns `relicToFullNameZH`.
- `src/components/render.tsx` owns Puppeteer image output through
  `generateImageOutput(puppe, element)`.
- `src/utils/http.ts` owns all HTTP request behavior and retry/error handling.
- `src/utils/logger.ts` defines the shared logger scope.

## Coding Conventions

Logging:

- Import the shared logger from `src/utils` or the appropriate relative path.
- Logger scope is `koishi-plugin-warframe`.
- Do not use `console.log`, `console.error`, or similar console calls in source
  code. Use `logger` instead.

HTTP:

- Use `fetchAsyncText`, `fetchAsyncData<T>`, or `fetchAsyncImage` from
  `src/utils/http.ts`.
- Do not call raw `fetch()` or `ofetch()` outside the HTTP utility.
- The HTTP utility owns timeout, retry, browser-like headers, and `Language:
  zh-hans` behavior.
- HTTP helpers log failures and return `undefined`; callers must handle
  `T | undefined`.

Caching:

- Use `createAsyncCache(factory, ttlMs)` for async caches with in-flight
  deduplication. Use `-1` for an infinite TTL.
- Use `CacheStorage<T>(limit)` for LRU promise caches, as in OCR flows.
- Prefer the factory + override pattern used by `globalItem.ts` and
  `globalRivenAttribute.ts` when adding testable data singletons.

TypeScript and types:

- Keep ambient declarations in `src/types/`.
- Domain types live under `src/types/wf/`, `src/types/wfm/`, and
  `src/types/miscs/`.
- Use `declare module` only when extending external package interfaces.

Error handling:

- Infrastructure and utils should catch operational failures, log them, and
  return `undefined`.
- Services return either user-facing error strings or successful data.
- User-facing error strings are in Chinese.

## Testing Rules

- Test files live in `tests/` and use `*.spec.ts`.
- Use Chai `expect()` assertions.
- Put `before()` and `after()` hooks inside `describe()` blocks. Do not add
  root-level Mocha hooks; they run before all test files and can leak state.
- Prefer fixture data and override helpers over live network calls.
- Test fixtures belong in `tests/assets/`.
- For async tests that intentionally touch slow paths or network-like behavior,
  set an explicit `this.timeout(...)`.

## Git And Workspace Safety

- Check `git status --short` before editing.
- If staged changes exist, do not modify them unless the user explicitly asks.
- Do not revert user changes.
- Keep edits focused on the requested area. Avoid unrelated refactors and
  metadata churn.
- Use `yarn` for validation commands.

## Current Maintenance Notes

- `globalRivenItem.ts`, `globalDucatnator.ts`, and `globalWorldState.ts` do not
  yet expose the factory + override injection pattern used by other data
  singletons.
- Several `data/wf/` modules build static caches through inline IIFEs, including
  `rivenDisposition`, `relics`, `rivenBaseValues`, and `arbitrationSchedule`.
  Their transform logic is harder to test in isolation.
- `relicQualityToName` and `relicQualityToTransKey` are exported and covered by
  adapter tests, but currently appear to have no runtime callers.
- `lich-c` and `lich-i` are hidden placeholder commands that return an
  in-development message.
