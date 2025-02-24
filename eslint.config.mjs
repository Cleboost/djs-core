import globals from "globals";
import js from "@eslint/js";
import ts from "typescript-eslint";
import headers from "eslint-plugin-headers";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ["packages/*/dist/**/*"] },
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.node } },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    plugins: {
      headers,
    },
    files: ["packages/*src/**/*"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='log']",
          message: "Use console.log() instead of log()",
        },
      ],
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "function", next: "function" },
      ],
      "headers/header-format": [
        "error",
        {
          source: "file",
          path: "header.txt",
          trailingNewlines: 2,
          variables: {
            year: "2025",
            author: "Cleboost",
          },
        },
      ],
    },
  },
];
