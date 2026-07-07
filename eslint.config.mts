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
  { files: ['**/*.md'], plugins: { markdown }, language: 'markdown/gfm' },
)
