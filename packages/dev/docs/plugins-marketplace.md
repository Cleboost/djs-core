---
title: "Plugins-Markplace"
---

Official database plugins are **deprecated**. Use [native Database](../essentials/database.md) instead.

See [Migrate from DB plugins](../guides/migrate-db-plugins.md) for upgrade steps.

| Plugin | Status | Replacement |
|---|---|---|
| `@djs-core/plugin-drizzle` | Deprecated | `db:` + `client.db` |
| `@djs-core/plugin-sql` | Deprecated | `db:` + `client.db` |
| `@djs-core/plugin-prisma-sqlite` | Deprecated | Drizzle native or Prisma direct |

Third-party plugins via `definePlugin` are not affected.
