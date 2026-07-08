# Contributing to koishi-plugin-warframe

First off, thank you for taking the time to contribute! 🎉

This document describes how to set up your environment, follow project conventions, and submit changes for review.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Code Conventions](#code-conventions)
- [Testing](#testing)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [License](#license)

---

## Code of Conduct

Participation in this project is governed by the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to **cloudeasoft@qq.com**.

---

## Development Environment

### Prerequisites

- **Node.js** >= 18 (tested on v24)
- **Yarn** (Yarn 4 with PnP-compatible workspace) — install via `npm i -g yarn`
- **VS Code** (recommended) with the workspace TypeScript version

### Setup

Follow the [Develop section in README.md](./README.md#develop) for the full koishi bootstrap process. Summary:

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
yarn test          # Run all tests (mocha + esbuild-register)
yarn build         # Full build (yakumo)
yarn install       # Install dependencies
```

Run a single test file:

```bash
yarn mocha tests/<file>.spec.ts
```

---

## Project Structure

The project follows a **domain-driven layered architecture**. Three domains — `wf` (Warframe game state), `wfm` (Warframe Market), `miscs` (miscellaneous APIs) — each split by layer:

```
src/
├── commands/         Thin handlers: service → component → render
├── components/       JSX → koishi Element renderers + Puppeteer output
├── services/         Business logic (pure functions + data orchestration)
├── data/             Cached data singletons (createAsyncCache wrappers)
├── infrastructure/   External API clients & data adapters
├── utils/            Generic, domain-agnostic primitives
├── types/            Ambient .d.ts type declarations (no runtime)
├── hooks/            Lifecycle hooks (on-ready)
└── assets/           Static data (JSON, TS string constants)
```

**Layer dependencies (strict, one-directional):**

```
commands → services → data → infrastructure → utils
       └→ components ──┘
```

- `services/` and `components/` are **sibling layers** — services never imports components, and vice versa. Only `commands/` calls into both.
- `utils/` must not import from any other layer.
- `components/` only depends on `utils/` + `types/`.

📖 **For the full architecture reference** — including data flow diagrams, per-layer file tables, the Factory+Override testing pattern, and technical debt notes — see **[docs/architecture.md](./docs/architecture.md)**.

---

## Code Conventions

Detailed guidance for AI assistants and contributors lives in **[AGENTS.md](./AGENTS.md)**. The following are the hard rules most relevant to contributors:

### Logging

Use the **single global logger** — never `console.log` / `console.error`:

```typescript
import { logger } from '../utils'

logger.info('message')
logger.warn('warning')
logger.error('error')
```

### HTTP Requests

Always use the shared wrappers from `src/utils/http.ts`:

```typescript
import { fetchAsyncData } from '../utils'

const data = await fetchAsyncData<MyType>('https://api.example.com/data')
if (!data) {
  return '获取数据失败' // handle undefined
}
```

**Never** use raw `fetch()` or `ofetch()` directly. All three wrappers (`fetchAsyncText` / `fetchAsyncData<T>` / `fetchAsyncImage`) provide 10s timeout, 3 retries, browser headers, and `Language: zh-hans`.

### Error Handling

- **Service functions** return `string` for user-facing error messages (Chinese), or the data type on success.
- **Infrastructure functions** return `T | undefined` (undefined = failure, logged internally). Never throw from infrastructure/utils.

### TypeScript

- Type declarations live in `src/types/` as ambient `.d.ts` files (global types, no import needed).
- Domain types are organized: `types/wf/`, `types/wfm/`, `types/miscs/`.

### File Placement

- **utils/**: generic, domain-agnostic primitives only. If it imports a Warframe-specific package, it belongs in `infrastructure/`.
- **infrastructure/**: one file per external API, imports from `utils/` only.
- **data/**: each file exports a `createAsyncCache` instance. Use the Factory+Override pattern (`globalItem.ts` as reference) when testability is needed.
- **commands/**: thin handlers, no business logic.
- **components/**: JSX renderers, depend on `utils/` + `types/` only.

---

## Testing

### Running Tests

```bash
yarn test                              # all tests
yarn mocha tests/cache.utils.spec.ts   # single file
```

### Writing Tests

- Test files live in `tests/`, named `<feature>.<domain>.spec.ts` or `<module>.utils.spec.ts`.
- Use `chai` `expect()` style assertions.
- `chai-as-promised` is **not** installed — use try/catch for rejected-promise assertions.
- For async tests needing network, set `this.timeout(...)` appropriately.
- Fixture JSON files go in `tests/assets/`.
- Use `overrideGlobal*` functions to inject fixture data and avoid live network in unit tests.

### ⚠️ Test Isolation (Critical)

**`before()` / `after()` hooks MUST be placed inside `describe()` blocks — never at the file root.**

Mocha runs root-level hooks before **all** test files in the suite, which causes cross-file interference when multiple files override the same global singleton. This was a real bug we encountered and fixed — root-level `before()` in one file overrode a cache that another file's test depended on.

✅ Correct:

```typescript
describe('My Feature', function () {
  this.timeout(10000)

  before(() => {
    overrideGlobalItemData(/* ... */)
  })

  it('should work', () => { /* ... */ })
})
```

❌ Wrong (will break other test files):

```typescript
before(() => {
  overrideGlobalItemData(/* ... */)
})

describe('My Feature', () => { /* ... */ })
```

---

## Commit Message Convention

This project follows [**Conventional Commits**](https://www.conventionalcommits.org/). Each commit message should be structured as:

```
<type>(<scope>): <description>
```

### Types

| Type       | Use for                                                |
| ---------- | ------------------------------------------------------ |
| `feat`     | New feature                                            |
| `fix`      | Bug fix                                                |
| `refactor` | Code restructuring without behavior change             |
| `docs`     | Documentation only                                      |
| `test`     | Adding or correcting tests                             |
| `chore`    | Build, tooling, dependencies, release chores           |
| `style`    | Formatting, whitespace, semicolons (no logic change)   |
| `perf`     | Performance improvement                                |
| `ci`       | CI/CD pipeline changes                                 |

### Scopes

| Scope     | Maps to                                  |
| --------- | ---------------------------------------- |
| `wf`      | Warframe game state (commands, services, data, infra) |
| `wfm`     | Warframe Market                          |
| `miscs`   | Miscellaneous APIs                       |
| `readme`  | README documentation                     |
| `deps`    | Dependency updates                       |
| (none)    | Cross-cutting or project-wide changes    |

### Examples

```
feat(wfm): add pmodhistory command
fix(wf): resolve possible runtime error, remove unused dependencies
refactor: re-organize utils folder
docs(readme): add new command descriptions
chore(release): 1.5.1 [skip ci]
```

If your change relates to an issue or PR, reference it in the description or body:

```
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
   yarn dtsc    # type-check must pass
   yarn test    # all tests must pass
   yarn build   # build must succeed
   ```

3. **Follow code conventions** — see [AGENTS.md](./AGENTS.md) and [docs/architecture.md](./docs/architecture.md). Respect the layer dependency rules; do not introduce imports that violate the one-directional flow.

4. **Write tests** for new features or bug fixes. Use the Factory+Override pattern to inject fixture data and avoid live network calls in unit tests. Place `before()`/`after()` hooks inside `describe()` blocks.

5. **Commit using Conventional Commits** (see above). Keep commits focused — one logical change per commit is ideal.

### Submitting

1. Push your branch to your fork and open a PR against `master`.
2. Use a clear title following the commit convention (e.g., `feat(wfm): add kuva lich support`).
3. Fill in the PR description:
   - **What** does this change do?
   - **Why** is it needed? (link any related issues)
   - **How** was it tested?
   - **Breaking changes** (if any)
4. CI (`.github/workflows/build-and-test.yml`) will automatically run `yarn build`, `yarn dtsc`, and `yarn test` on your PR. All checks must pass.
5. Address review feedback by pushing additional commits (avoid force-pushing unless requested).

### Review Criteria

- ✅ Type-check passes (`yarn dtsc`)
- ✅ All tests pass (`yarn test`)
- ✅ Build succeeds (`yarn build`)
- ✅ No `console.log` / raw `fetch` / layer violations
- ✅ Tests cover new logic
- ✅ Commit messages follow Conventional Commits

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
