---
"@djs-core/dev": patch
---

Security, reliability, and DX improvements:

  - Include modals in the production generated entry
  - Lazy-load ts-morph for `djs-core check` and keep it external in the CLI bundle
  - Read CLI `--version` from `@djs-core/dev` `package.json`
  - Sanitize `djs-core generate` output paths against directory traversal
  - Harden generated Dockerfiles (`USER bun`, healthcheck, optional migrations copy) and add `--docker`
  - Handle `SIGTERM` during `djs-core dev` shutdown (Docker/systemd)
  - Improve dev HMR: unload buttons before reload, warn when `djs.config.ts` changes, document restart requirements
  - Generate `PostgresJsDatabase` types for PostgreSQL (matches `postgres-js` runtime driver)
