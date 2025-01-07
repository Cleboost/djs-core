import globals from "globals";
import js from "@eslint/js";
import ts from "typescript-eslint";
import headers from "eslint-plugin-headers";

/** @type {import('eslint').Linter.Config[]} */
export default [
	{ignores: ["dist/**/*", "test/**/*"]},
	{ files: ["**/*.{js,mjs,cjs,ts}"]},
	{ languageOptions: { globals: globals.node } },
	js.configs.recommended,
	...ts.configs.recommended,
	{
		plugins: {
			headers,
		},
		files: ["src/**/*.{js,mjs,cjs,ts}"],
		ignores: ["dist/**/*"],
		rules: {
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
