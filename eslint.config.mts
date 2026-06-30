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
    ignores: ["lib/**/*"], // Exclude build files
  },
  {
    files: ["**/*.{js,ts}"],
    extends: [tseslint.configs.recommended],
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
