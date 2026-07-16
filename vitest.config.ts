import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const require = createRequire(import.meta.url)
const elementRuntime = require.resolve('@satorijs/element')

export default defineConfig({
  oxc: {
    jsx: {
      development: false,
      importSource: '@satorijs/element',
      runtime: 'automatic',
    },
  },
  resolve: {
    alias: {
      '@satorijs/element/jsx-dev-runtime': elementRuntime,
      '@satorijs/element/jsx-runtime': elementRuntime,
      'koishi': fileURLToPath(new URL('./node_modules/koishi/lib/index.cjs', import.meta.url)),
    },
  },
  test: {
    globals: true,
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    hookTimeout: 120000,
    testTimeout: 120000,
    coverage: {
      provider: 'v8',
      exclude: ['lib', 'types', 'components', 'tests'],
      clean: true,
      cleanOnRerun: true,
      reportsDirectory: './coverage',
      thresholds: {
        functions: 50,
      },
    },
  },
})
