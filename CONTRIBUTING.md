# Contributing to koishi-plugin-warframe

First off, thank you for taking the time to contribute! 🎉

This document describes how to set up your environment, follow project conventions, and submit changes for review.

## Table of Contents

- [Contributing to koishi-plugin-warframe](#contributing-to-koishi-plugin-warframe)
  - [Table of Contents](#table-of-contents)
  - [Code of Conduct](#code-of-conduct)
  - [Development Environment](#development-environment)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
    - [VS Code TypeScript Version](#vs-code-typescript-version)
    - [Common Commands](#common-commands)
  - [Project Structure](#project-structure)
  - [Code Conventions](#code-conventions)
    - [Logging](#logging)
    - [HTTP Requests](#http-requests)
    - [Error Handling](#error-handling)
    - [TypeScript](#typescript)
    - [File Placement](#file-placement)
  - [Testing](#testing)
    - [Running Tests](#running-tests)
    - [Writing Tests](#writing-tests)
    - [Test Isolation](#test-isolation)
  - [Commit Message Convention](#commit-message-convention)
    - [Types](#types)
    - [Scopes](#scopes)
    - [Examples](#examples)
  - [Pull Request Process](#pull-request-process)
    - [Before Submitting](#before-submitting)
    - [Submitting](#submitting)
    - [Review Criteria](#review-criteria)
  - [Reporting Issues](#reporting-issues)
  - [License](#license)

---

## Code of Conduct

Participation in this project is governed by the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to **cloudeasoft@qq.com**.

---

## Development Environment

### Prerequisites

- **Node.js** >= 18 (tested on v24)
- **Yarn** 4 (Corepack: `corepack enable && corepack prepare yarn@4.5.3 --activate`)
- **VS Code** (recommended) with the workspace TypeScript version

This package is part of a Koishi/Yarn workspace. Do not add a package-local `yarn.lock`; the lockfile is managed at the workspace root.

### Setup

Follow the [Develop section in README.md](./README.md#develop) for the full Koishi bootstrap process. Summary:

```bash
# 1. Create a koishi project (in your preferred parent directory)
yarn create koishi

# 2. Clone this plugin into the koishi project's external/ directory
yarn clone CloudeaSoft/koishi-plugin-warframe

# 3. Install dependencies
yarn install
```

### VS Code TypeScript Version

Open any `.ts` file, click the `{ }` item in the status bar, then select **Use Workspace Version**. This avoids spurious warnings from newer global TypeScript installations. See [VS Code docs](https://code.visualstudio.com/docs/typescript/typescript-transpiling#_using-newer-typescript-versions) for details.

### Common Commands

```bash
yarn dtsc          # Type-check (no emit)
yarn test          # Run all tests (vitest)
yarn build         # Full build (yakumo)
yarn lint          # ESLint, including markdown
yarn install       # Install dependencies from the workspace setup
```

Run a single test file:

```bash
yarn vitest run tests/<file>.spec.ts
```

`yarn build` must run before `yarn test`: the package-boundary specs under `tests/packages/` and `tests/components/renderAssets.spec.ts` read `lib/index.js`. The full validation order used by CI is:

```bash
yarn build && yarn dtsc && yarn lint && yarn test
```

---

## Project Structure

The project follows a **domain-driven layered architecture**. Three domains — `wf` (Warframe game state), `wfm` (Warframe Market), `miscs` (miscellaneous APIs) — live under `src/warframe/`. Koishi-facing code sits beside that domain root and may only import it through the facade.

```text
src/
|-- index.ts              # plugin entry; registers commands, hooks, and schedules
|-- commands/             # thin Koishi command handlers
|-- components/           # JSX -> Koishi Element renderers + Puppeteer output
|-- i18n.ts               # structured errors -> Chinese user-facing text
|-- messages/             # Koishi Element message builders
|-- types/                # Koishi configuration and dependency types
|-- utils/                # Koishi presentation helpers
|-- assets/               # render HTML/CSS/SVG
|-- hooks/                # on-ready lifecycle hooks
|-- schedules/            # cron jobs (world-state refresh, primed mod history)
`-- warframe/             # self-contained domain (future SDK)
    |-- index.ts          # sole public domain facade
    |-- services/         # business logic and data orchestration
    |-- data/             # cached data singletons
    |-- infrastructure/   # external API clients and package adapters
    |-- utils/            # private domain primitives (including HTTP)
    |-- types/            # domain type declarations
    `-- assets/           # Warframe static JSON and text data
```

**Layer dependencies (strict, one-directional):**

```text
commands -> warframe/index.ts -> services -> data -> infrastructure -> utils
commands -> components -> presentation utils
```

- `src/warframe/index.ts` is the only domain entry available to Koishi-facing code.
- `src/warframe/` must not import outside its subtree or depend on Koishi, Satori Element, or Puppeteer.
- `commands/` may import from the Warframe facade, `components/`, `i18n.ts`, `messages/`, and Koishi-specific configuration.
- `components/` may import from presentation `utils/` and the Warframe facade only. It must not import from `services/`, `data/`, or `infrastructure/`.
- `src/assets/` contains only Koishi render resources; `src/utils/` contains only presentation-side helpers.

The full architecture reference — including layer rules, important modules, and maintenance notes — lives in **[AGENTS.md](./AGENTS.md)**.

---

## Code Conventions

Detailed guidance for AI assistants and contributors lives in **[AGENTS.md](./AGENTS.md)**. The following are the hard rules most relevant to contributors:

### Logging

Koishi entry points, controllers, and adapters own contextual logging through the Koishi logger scoped to `koishi-plugin-warframe`. Domain code under `src/warframe/` must remain independent of Koishi, including logging. Never `console.log` / `console.error`:

```typescript
export function apply(ctx: Context): void {
  const deps: PluginDependencies = {
    logger: ctx.logger('koishi-plugin-warframe'),
    // ...
  }
}
```

Use `deps.logger` from `PluginDependencies` in Koishi-facing modules (`src/hooks/`, `src/schedules/`, commands). Do not import a global logger from `src/utils/`.

### HTTP Requests

Always use the shared wrappers from `src/warframe/utils/http.ts` (re-exported by `src/warframe/utils/`):

```typescript
import { fetchAsyncData } from '../utils'

const data = await fetchAsyncData<MyType>('https://api.example.com/data')
if (!data) {
  return failure('common.fetchFailed', true)
}
```

**Never** use raw `fetch()` or `ofetch()` directly. All three wrappers (`fetchAsyncText` / `fetchAsyncData<T>` / `fetchAsyncImage`) provide 10s timeout, 3 retries, browser headers, and `Language: zh-hans`. HTTP helpers catch operational failures and return `undefined`; callers must handle `T | undefined`.

### Error Handling

- **Infrastructure and utils** return `T | undefined` (undefined = failure). Never throw from those layers.
- **Warframe services** return `WarframeResult<T>`: `{ ok: true, data }` on success, or `{ ok: false, error }` with a stable error code, retryability, and optional interpolation parameters.
- **Commands** map failures to Chinese text with `t()` from `src/i18n.ts`. New error codes need a matching message there.

```typescript
const result = await getAlerts()
if (!result.ok) {
  return t(result)
}
return render(AlertComponent(result.data))
```

### TypeScript

- Koishi configuration declarations live in `src/types/` (`config.d.ts`).
- Domain types live under `src/warframe/types/wf/`, `src/warframe/types/wfm.ts`, and `src/warframe/types/miscs/`.
- Use `declare module` only when extending external package interfaces.

### File Placement

- **`src/warframe/utils/`**: reusable domain primitives, including HTTP. If a helper is Warframe-specific, it belongs here rather than in presentation `src/utils/`.
- **`src/warframe/infrastructure/`**: one adapter or client per external API; may import from domain `utils/` only.
- **`src/warframe/data/`**: cache-backed singletons around infrastructure calls (`createAsyncCache`). Use the factory + override pattern (`globalItem.ts` / `overrideGlobalItemData`) when testability is needed.
- **`src/warframe/services/`**: user-facing behavior. Prefer pure helpers for transforms. Do not import from `components/`.
- **`src/commands/`**: thin handlers — parse input, call a facade query, branch on `WarframeResult`, render. No business logic.
- **`src/components/`**: JSX renderers; depend on presentation `utils/` and the Warframe facade only.
- **`src/utils/`**: Koishi presentation helpers only (assets, color).

---

## Testing

### Running Tests

```bash
yarn test                                          # all tests
yarn vitest run tests/utils/cache.utils.spec.ts    # single file
```

The test stack is Vitest with Mocha-style globals (`describe` / `it` / `before` / `after`) and Chai assertions.

### Writing Tests

- Test files live in `tests/` and use `*.spec.ts`.
- Use `chai` `expect()` style assertions.
- `chai-as-promised` is **not** installed — use try/catch for rejected-promise assertions.
- For async tests that intentionally touch slow paths or network-like behavior, set `this.timeout(...)`.
- Fixture JSON files go in `tests/assets/`.
- Prefer fixture data and `overrideGlobal*` helpers over live network calls. Internal service tests may import implementations directly; Koishi-facing code still goes through `src/warframe/index.ts`.

### Test Isolation

**`before()` / `after()` hooks MUST be placed inside `describe()` blocks — never at the file root.**

Root-level Mocha-style hooks can leak singleton overrides across files. This was a real bug: a root-level hook in one file overrode a cache that another file's test depended on.

Correct:

```typescript
describe('My Feature', function () {
  this.timeout(10000)

  before(() => {
    overrideGlobalItemData(/* ... */)
  })

  it('should work', () => { /* ... */ })
})
```

Wrong (will break other test files):

```typescript
before(() => {
  overrideGlobalItemData(/* ... */)
})

describe('My Feature', () => { /* ... */ })
```

---

## Commit Message Convention

This project follows [**Conventional Commits**](https://www.conventionalcommits.org/). Each commit message should be structured as:

```text
<type>(<scope>): <description>
```

### Types

| Type       | Use for                                              |
| ---------- | ---------------------------------------------------- |
| `feat`     | New feature                                          |
| `fix`      | Bug fix                                              |
| `refactor` | Code restructuring without behavior change           |
| `docs`     | Documentation only                                   |
| `test`     | Adding or correcting tests                           |
| `chore`    | Build, tooling, dependencies, release chores         |
| `style`    | Formatting, whitespace, semicolons (no logic change) |
| `perf`     | Performance improvement                              |
| `ci`       | CI/CD pipeline changes                               |

### Scopes

| Scope     | Maps to                                               |
| --------- | ----------------------------------------------------- |
| `wf`      | Warframe game state (commands, services, data, infra) |
| `wfm`     | Warframe Market                                       |
| `miscs`   | Miscellaneous APIs                                    |
| `readme`  | README documentation                                  |
| `deps`    | Dependency updates                                    |
| (none)    | Cross-cutting or project-wide changes                 |

### Examples

```text
feat(wfm): add pmodhistory command
fix(wf): resolve possible runtime error, remove unused dependencies
refactor: re-organize utils folder
docs(readme): add new command descriptions
```

If your change relates to an issue or PR, reference it in the description or body:

```text
fix(wf): new incarnon genesis (#42)
```

---

## Pull Request Process

### Before Submitting

1. **Fork** the repository and create your branch from `master`:

   ```bash
   git checkout -b feat(wfm)-my-feature master
   ```

2. **Install dependencies** and verify locally:

   ```bash
   yarn install
   yarn build   # build must succeed
   yarn dtsc    # type-check must pass
   yarn lint    # eslint, including markdown
   yarn test    # all tests must pass
   ```

3. **Write tests** for new features or bug fixes. Use the Factory+Override pattern to inject fixture data and avoid live network calls in unit tests. Place `before()`/`after()` hooks inside `describe()` blocks.

4. **Commit using Conventional Commits** (see above). Keep commits focused — one logical change per commit is ideal.

### Submitting

1. Push your branch to your fork and open a PR against `master`.
2. Use a clear title following the commit convention (e.g., `feat(wfm): add kuva lich support`).
3. Fill in the PR description:
   - **What** does this change do?
   - **Why** is it needed? (link any related issues)
   - **How** was it tested?
   - **Breaking changes** (if any)
4. CI (`.github/workflows/build-and-test.yml`) will automatically run `yarn build`, `yarn dtsc`, `yarn lint`, and `yarn test` on your PR. All checks must pass.
5. Address review feedback by pushing additional commits (avoid force-pushing unless requested).

### Review Criteria

- Type-check passes (`yarn dtsc`)
- All tests pass (`yarn test`)
- Build succeeds (`yarn build`)
- Lint passes (`yarn lint`)
- No `console.log` / raw `fetch` / layer violations
- Tests cover new logic
- Commit messages follow Conventional Commits

---

## Reporting Issues

Use the issue templates in [`.github/ISSUE_TEMPLATE/`](./.github/ISSUE_TEMPLATE):

- **[Bug Report](./.github/ISSUE_TEMPLATE/bug_report.md)** — something isn't working as expected
- **[Feature Request](./.github/ISSUE_TEMPLATE/feature_request.md)** — suggest a new command or improvement
- **[Custom](./.github/ISSUE_TEMPLATE/custom.md)** — anything else

When reporting a bug, include:

- Koishi version and plugin version
- Steps to reproduce
- Expected vs. actual behavior
- Relevant logs (the plugin uses scope `koishi-plugin-warframe`)

---

## License

By contributing, you agree that your contributions will be licensed under the **GPL-3.0** license. See [LICENSE](./LICENSE) for details.
