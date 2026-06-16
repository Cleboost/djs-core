---
"@djs-core/dev": patch
---

Refactor dev tooling internals and fix several bugs.

- Replace 6 near-identical `scan*` functions with a single generic `scanDir<T>`, reducing ~300 lines of duplication
- Extract shared plugin resolution logic into `utils/plugin.ts`
- Fix `-p/--path` option not capturing its value in the `dev` command
- Remove unnecessary `usePolling` from chokidar (caused 300ms delay on Linux)
- Fix confusing TDZ error when `djs.config.ts` fails to load (e.g. missing TOKEN)
