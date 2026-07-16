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
- Koishi service injection: keep `database` in `inject.required`. This plugin's
  `ctx.broadcast()` usage requires the database service; do not remove the
  `database` injection while broadcast functionality exists.
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
|-- messages/             # structured errors -> Koishi-facing messages
|-- types/                # Koishi configuration and dependency types
|-- utils/                # Koishi presentation helpers
|-- assets/               # render HTML/CSS/SVG
`-- warframe/             # self-contained future SDK source root
    |-- index.ts          # sole public domain facade
    |-- services/         # business logic and data orchestration
    |-- data/             # cached data singletons
    |-- infrastructure/   # external API clients and package adapters
    |-- utils/            # private domain primitives
    |-- types/            # domain type declarations
    `-- assets/           # Warframe static JSON and text data
```

Layer direction is one-way:

```text
commands -> warframe/index.ts -> services -> data -> infrastructure -> utils
commands -> components -> presentation utils
```

Dependency rules:

- `src/warframe/index.ts` is the only domain entry available to Koishi-facing
  code.
- `src/warframe/` must not import outside its subtree or depend on Koishi,
  Satori Element, or Puppeteer.
- `src/warframe/infrastructure/` may import from `src/warframe/utils/`.
- `src/warframe/data/` may import from domain `infrastructure/` and `utils/`.
- `src/warframe/services/` may import from domain `data/`, `infrastructure/`,
  `utils/`, `assets/`, and `types/`. It must not import from `components/`.
- Koishi-facing modules import Warframe queries and exported domain types through
  `src/warframe/index.ts`. Internal service tests may import implementations
  directly.
- `commands/` may import from the Warframe facade, `components/`, `messages/`,
  and Koishi-specific configuration.
- `components/` may import from presentation `utils/` and the Warframe facade
  only. It must not import from `services/`, `data/`, or `infrastructure/`.
- `src/assets/` contains only Koishi render resources; `src/utils/` contains
  only presentation-side helpers.

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
- Utils: presentation helpers live in `src/utils/`; reusable domain primitives
  live in `src/warframe/utils/`.

## Important Modules

- `src/warframe/infrastructure/wf/wf-export-adapter.ts` adapts
  `warframe-public-export-plus` data such as relics, regions, and relic quality.
- `src/warframe/infrastructure/wf/wfcd-adapter.ts` adapts `warframe-worldstate-data`
  values such as nodes, mission types, fissure tiers, and Void Trader items.
  It also owns `relicToFullNameZH`.
- `src/components/render.tsx` owns Puppeteer image output through
  `generateImageOutput(puppe, element)`.
- `src/warframe/index.ts` is the public boundary for Koishi-facing data queries
  and explicitly exported domain types.
- `src/warframe/utils/http.ts` owns all HTTP request behavior and retry/error
  handling.

## Coding Conventions

Logging:

- Koishi entry points, controllers, and adapters own contextual logging through
  the Koishi logger scoped to `koishi-plugin-warframe`.
- Everything under `src/warframe/` must remain independent of Koishi, including
  logging.
- Do not use `console.log`, `console.error`, or similar console calls in source
  code.

HTTP:

- Use `fetchAsyncText`, `fetchAsyncData<T>`, or `fetchAsyncImage` from
  `src/warframe/utils/http.ts`.
- Do not call raw `fetch()` or `ofetch()` outside the HTTP utility.
- The HTTP utility owns timeout, retry, browser-like headers, and `Language:
  zh-hans` behavior.
- HTTP helpers catch operational failures and return `undefined`; callers must
  handle `T | undefined` and services translate failures into structured errors.

Caching:

- Use `createAsyncCache(factory, ttlMs)` for async caches with in-flight
  deduplication. Use `-1` for an infinite TTL.
- Use `CacheStorage<T>(limit)` for LRU promise caches, as in OCR flows.
- Prefer the factory + override pattern used by `globalItem.ts` and
  `globalRivenAttribute.ts` when adding testable data singletons.

TypeScript and types:

- Keep Koishi configuration declarations in `src/types/`.
- Domain types live under `src/warframe/types/wf/`,
  `src/warframe/types/wfm.d.ts`, and `src/warframe/types/miscs/`.
- Use `declare module` only when extending external package interfaces.

Error handling:

- Infrastructure and utils catch operational failures and return `undefined`.
- Warframe services return `WarframeResult<T>` with stable error codes,
  retryability, and optional interpolation parameters.
- `src/messages.ts` maps Warframe error codes to Chinese user-facing text.
- Koishi controllers and adapters log runtime context at the framework boundary.

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
