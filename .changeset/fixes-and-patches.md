---
"@djs-core/runtime": patch
"@djs-core/dev": patch
"@djs-core/db": patch
---

Security, reliability, and DX fixes across the core packages.

### `@djs-core/runtime`

- Catch event listener failures in `EventHandler` instead of crashing the process
- Close database, DataStore, and cron jobs in `DjsClient.destroy()`
- Route slash command sync through `ApplicationCommandHandler` only (no duplicate compiler path)
- Cap autocomplete responses at 25 choices with a warning when trimmed
- Cache SQLite prepared statements in `DataStore` for store/get/delete/cleanup

### `@djs-core/dev`

- Include modals in the production generated entry
- Lazy-load ts-morph for `djs-core check` and keep it external in the CLI bundle
- Read CLI `--version` from `@djs-core/dev` `package.json`
- Sanitize `djs-core generate` output paths against directory traversal
- Harden generated Dockerfiles (`USER bun`, healthcheck, optional migrations copy) and add `--docker`
- Handle `SIGTERM` during `djs-core dev` shutdown (Docker/systemd)
- Improve dev HMR: unload buttons before reload, warn when `djs.config.ts` changes, document restart requirements
- Generate `PostgresJsDatabase` types for PostgreSQL (matches `postgres-js` runtime driver)

### `@djs-core/db`

- Parse `db:` from `djs.config.ts` with a strict JSON-like parser instead of `new Function()`
- Throw when `autoMigrate` is enabled but `db/migrations` is missing (default examples use `autoMigrate: false`)
