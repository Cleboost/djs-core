---
"@djs-core/dev": patch
---

Lazy-load ts-morph for `djs-core check` and mark it external in the CLI bundle so `dist/index.js` stays small and `--help` does not load TypeScript tooling.
