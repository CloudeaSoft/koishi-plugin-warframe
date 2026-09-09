---
name: add-wf-command
description: Add a new Koishi command to koishi-plugin-warframe end to end (types, service, facade export, component, i18n, command handler, tests, README). Use when implementing a new user-facing command or extending an existing one with a new data source.
---

# Add a Warframe command

Follow the layer order below; each step names the file to touch and the
pattern to copy. The `alert` command (`feat(wf): add alert command`) is the
reference implementation; `rg -n alert src tests README.md` shows every
touch point.

## 1. Domain types: `src/warframe/types/wf/<feature>.ts`

Declare the shape the component will render (`<Feature>Info`, `<Feature>Board`).
Re-export it from `src/warframe/types/index.ts` with `export type { ... }`.
Types stay free of Koishi and Satori imports.

## 2. Service: `src/warframe/services/wf-service.ts` (or a new file under `services/`)

- Write a pure `adapt<Feature>(raw, now = Date.now())` that maps upstream data
  to the domain types. Keep it exported so tests can call it with fixtures.
- Write `get<Feature>(): Promise<WarframeResult<...>>` that reads from a data
  singleton (`globalWorldState.get()`, `globalItem`, ...) and returns
  `failure('common.fetchFailed', true)` when the source is missing,
  `failure('<feature>.unavailable')` when the result is empty, otherwise
  `{ ok: true, data }`. Wrap in `try`/`catch` and never throw.
- Resolve display text with the official Chinese dictionaries
  (`dict_zh` from `warframe-public-export-plus`, `dictZhExtra` from
  `src/warframe/assets`) and node/mission helpers from
  `src/warframe/infrastructure/wf/wfcd-adapter.ts` and `wf-export-adapter.ts`.
- New remote data belongs in `src/warframe/infrastructure/` behind
  `fetchAsyncData<T>` and a `createAsyncCache` singleton in
  `src/warframe/data/`; use the factory + override pattern from
  `src/warframe/data/wfm/globalItem.ts` so tests can inject fixtures.

## 3. Error codes: `src/warframe/types/warframe-result.ts` and `src/i18n.ts`

Add each new code to the `warframeErrorCodes` array and give it a Chinese
message in `messages`; `yarn dtsc` fails if the two drift apart.

## 4. Facade: `src/warframe/index.ts`

`export * from './services'` already exposes new service exports; only touch
the facade when a new module needs re-exporting. Koishi-facing code imports
from `'../warframe'` only.

## 5. Component: `src/components/wf.tsx`

Add `export function <Feature>Component(data): Element` returning Satori JSX.
Reuse existing layout helpers in the file (card, table, and badge helpers) and
`src/utils/color.ts`. No data fetching and no imports from
`src/warframe/services|data|infrastructure`.

## 6. Command handler: `src/commands/wf.ts` and `src/commands/index.ts`

- Add `<feature>Command: (_action: Argv) => Promise<string>` to the handler
  interface and implementation. The body is three lines: call the facade
  query, `return t(result)` on failure, `return render(<Feature>Component(result.data))`.
- Register it in `src/commands/index.ts` with
  `ctx.command('<name>', '<Chinese description>').alias('<中文别名>').action(wf.<feature>Command)`.

## 7. Tests

- `tests/services/wf/<feature>.wf.spec.ts`: call `adapt<Feature>` with inline
  fixtures and a fixed `NOW`; assert Chinese names come from `dict_zh` /
  `dictZhExtra`, expiry filtering, and the `failure` codes.
- `tests/components/<feature>.wf.spec.ts`: build a board fixture and assert on
  the rendered element tree (`toString()` contains headings, counts, and empty
  states).
- Put `before()`/`after()` inside `describe()`. No live network.

## 8. Documentation and evidence

Add a row to the matching table in `README.md` (command, arguments, aliases,
description). Update `TODO.md` if the command closes an item there.

After `yarn build`, talk to the bot: `yarn capture "<command>" "<alias>"
"<command> <bad-argument>"` sends the messages to the built plugin inside a
real Koishi app and saves the replies (PNG for images, `.txt` for text). Check
that the populated state and the error path both look right, and embed the
files in the pull request.

## 9. Validate

```bash
yarn build && yarn dtsc && yarn lint && yarn test
```

All four must pass. `yarn build` first: package-boundary specs read
`lib/index.js`.
