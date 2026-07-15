import antfu from '@antfu/eslint-config'

import markdown from '@eslint/markdown'

export default antfu(
  {
    vue: false,
    type: 'lib',
    ignores: [
      '**/lib/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/*.tsbuildinfo',
      '/tests/assets/*',
      '**/assets/**',
    ],
    typescript: {
      tsconfigPath: 'tsconfig.json',
      filesTypeAware: ['src/**/*.{ts,tsx}'],
      overrides: {
        'ts/no-require-imports': 'off',
      },
      overridesTypeAware: {
        'ts/no-redundant-type-constituents': 'off',
        'ts/require-await': 'off',
        'ts/strict-boolean-expressions': 'off',
      },
    },
  },
  {
    files: ['src/commands/*.ts'],
    rules: {
      'no-unused-vars': 'off',
      'ts/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
    },
  },
  {
    files: ['src/components/*.tsx', 'src/messages/*.tsx'],
    rules: { 'ts/no-unsafe-assignment': 'off', '@typescript-eslint/no-unsafe-return': 'off' },
  },
  {
    files: ['src/warframe/data/**/*.ts'],
    rules: {
      'import/no-mutable-exports': 'off',
    },
  },
  {
    files: [
      'tests/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}',
    ],
    rules: {
      'antfu/no-top-level-await': 'off',
      'curly': ['error', 'all'],
      'no-undef': 'off',
      'test/consistent-test-it': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unused-imports/no-unused-imports': 'error',
    },
  },
  { files: ['**/*.md'], plugins: { markdown }, language: 'markdown/gfm' },
)
