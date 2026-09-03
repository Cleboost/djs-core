# @djs-core/db

## 1.0.1

### Patch Changes

- 940ea61: Security and reliability improvements:

  - Parse `db:` from `djs.config.ts` with a strict JSON-like parser instead of `new Function()`
  - Throw when `autoMigrate` is enabled but `db/migrations` is missing (default examples use `autoMigrate: false`)

## 1.0.0

### Major Changes

- Add native `@djs-core/db` with `client.db`, `db:` config, and `djs-core db` CLI.

  - New `@djs-core/db` package — Drizzle layer with sqlite, postgresql, mysql, and turso dialects
  - `db:` block in `djs.config.ts` with optional `autoMigrate`
  - `interaction.client.db` typed via `.djscore/db.d.ts`
  - CLI: `djs-core db init | generate | migrate | push | studio | pull`
  - Drizzle Kit config synced from `djs.config.ts` without loading secrets
  - DB code tree-shaken from bundle when `db:` is not configured
  - Official database plugins deprecated in favor of native DB

## 0.0.1

Placeholder publish for npm OIDC trusted publishing setup.
