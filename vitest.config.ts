import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      koishi: fileURLToPath(new URL('./node_modules/koishi/lib/index.cjs', import.meta.url)),
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
