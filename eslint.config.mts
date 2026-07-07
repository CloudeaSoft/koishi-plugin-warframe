import globals from "globals";
import tseslint from "typescript-eslint";
import markdown from "@eslint/markdown";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { globals: globals.node },
  },
  {
    ignores: ["**/lib/**", "**/dist/**", "**/node_modules/**"], // Exclude build files
  },
  {
    files: ["**/*.{js,ts}"],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ["**/*.{js,ts}"],
    ignores: ["tests/**/*", "./*.{js,ts}"],
    extends: [tseslint.configs.recommendedTypeCheckedOnly],
    rules: {
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
    },
    languageOptions: {
      parserOptions: {
        projectService: true
      },
    },
  },
  {
    files: ["**/*.{js,ts}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Disable unused vars check for commands
    files: ["src/commands/*.ts"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  { files: ["**/*.md"], plugins: { markdown }, language: "markdown/gfm" },
]);
