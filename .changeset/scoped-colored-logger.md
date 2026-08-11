---
"@djs-core/runtime": minor
"@djs-core/dev": patch
---

Add a scoped colored logger shared by the runtime and dev CLI.

- New `HH:MM [SCOPE]` log format with levels (`debug`, `info`, `success`, `warn`, `error`) and TTY-aware colors
- Export `createLogger`, `runtimeLog`, `devLog`, `pluginLog`, and related types from `@djs-core/runtime`
- Replace ad-hoc `console.log` / `picocolors` usage across runtime handlers and dev commands with the unified logger
- Add `warnBlock()` for multi-line warnings such as permission mismatches during command sync
