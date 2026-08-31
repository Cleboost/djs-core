# Migrate from DB plugins

Official `@djs-core/plugin-drizzle`, `@djs-core/plugin-sql`, and `@djs-core/plugin-prisma-sqlite` are deprecated. Use native `db:` + `client.db` instead.

## plugin-drizzle → native

1. Replace `plugins` + `pluginsConfig.drizzle` with `db: { dialect: "sqlite", autoMigrate: true }`
2. Move `src/db/schema.ts` → `db/schema.ts`
3. `client.drizzle` → `client.db`, import `{ schema } from "@djs-core/db"`
4. `djs-core drizzle *` → `djs-core db *`
5. Remove `drizzle.config.ts`

## plugin-sql → native

1. Add `db:` config, run `djs-core db init`
2. Define tables in `db/schema.ts`, migrate
3. Replace `client.sql` tagged templates with Drizzle queries on `client.db`
4. Remove table DDL from `ready` events

## plugin-prisma-sqlite

No drop-in replacement — migrate schema to Drizzle or keep Prisma outside the plugin system.

See [Database](../essentials/database.md) for full setup.
