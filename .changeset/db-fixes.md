---
"@djs-core/db": patch
---

Security and reliability improvements:

  - Parse `db:` from `djs.config.ts` with a strict JSON-like parser instead of `new Function()`
  - Throw when `autoMigrate` is enabled but `db/migrations` is missing (default examples use `autoMigrate: false`)
