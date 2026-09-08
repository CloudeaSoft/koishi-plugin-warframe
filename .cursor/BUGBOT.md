# Bugbot Review Rules for koishi-plugin-warframe

Project conventions for pull-request review. The full guidance for
contributors and agents lives in [AGENTS.md](../AGENTS.md); flag violations of
the rules below as findings.

## Layer boundaries

- `src/warframe/` is a self-contained domain. Files under it must not import
  `koishi`, `koishi-plugin-puppeteer`, `@satorijs/element`, or anything outside
  `src/warframe/`.
- Koishi-facing code (`src/commands/`, `src/components/`, `src/messages/`,
  `src/i18n.ts`, `src/schedules/`) must import domain code only through
  `src/warframe/index.ts`. Deep imports such as `../warframe/services/...` or
  `../warframe/data/...` are violations.
- `src/components/` must not import from services, data, or infrastructure.
- Dependency direction is one-way: `services -> data -> infrastructure -> utils`.
  A lower layer importing a higher one is a violation.

## HTTP, logging, and errors

- All HTTP goes through `fetchAsyncText`, `fetchAsyncData<T>`, or
  `fetchAsyncImage` in `src/warframe/utils/http.ts`. Flag raw `fetch()` or
  `ofetch()` anywhere else.
- No `console.*` calls in `src/`. Koishi-facing code uses the Koishi logger;
  code under `src/warframe/` does not log at all.
- Infrastructure and utils return `undefined` on operational failure instead of
  throwing. Callers must handle `T | undefined`; services translate failures into
  `WarframeResult<T>` with a stable error code. New error codes need a Chinese
  message in `src/i18n.ts`.

## Caching and data singletons

- Async caches use `createAsyncCache(factory, ttlMs)`; do not hand-roll
  promise caches or module-level mutable state for remote data.
- New data singletons should follow the factory + override pattern from
  `src/warframe/data/wfm/globalItem.ts` so tests can inject fixtures.

## Tests

- Tests live in `tests/**/*.spec.ts`, use Chai `expect()`, and put
  `before()`/`after()` inside `describe()` blocks. Root-level hooks leak state
  across files and are a blocking finding.
- Unit tests must not hit the network; use fixtures in `tests/assets/` and the
  `overrideGlobal*` helpers. Flag new specs that call live APIs.
- Do not introduce `chai-as-promised`; use explicit `try`/`catch`.
- Behavior changes in services, components, or adapters should come with
  tests. Flag new commands that lack a component or service spec.

## Commands and user-facing text

- Command handlers in `src/commands/` stay thin: parse input, call a facade
  query, branch on the result, render. Business logic there is a finding.
- User-facing text is Chinese and lives in components, messages, or `i18n.ts`,
  not in services.
- New or changed commands must be reflected in the `README.md` command tables.

## Repository hygiene

- Do not add a package-local `yarn.lock`; the lockfile is managed by the parent
  Koishi workspace.
- Commit messages and PR titles follow Conventional Commits with scopes `wf`,
  `wfm`, `miscs`, `readme`, or `deps`.
- Changes to `.github/workflows/`, `.releaserc.yml`, or dependency major
  versions are out of scope for autonomous loop PRs (`docs/loop/README.md`) and
  should be called out explicitly.
