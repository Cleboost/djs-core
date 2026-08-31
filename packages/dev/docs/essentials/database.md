# Database

Native Drizzle database — configure `db:` in `djs.config.ts`, schema in `db/schema.ts`, queries on `interaction.client.db`.

Official database plugins are deprecated. See [Migrate from DB plugins](../guides/migrate-db-plugins.md).

## Quick start

```ts
// djs.config.ts
export default defineConfig({
  token: process.env.TOKEN!,
  servers: [],
  db: { dialect: "sqlite", autoMigrate: true },
});
```

```bash
djs-core db init
djs-core db generate
djs-core db migrate
```

```ts
import { eq, schema } from "@djs-core/db";

await interaction.client.db
  .select()
  .from(schema.todos)
  .where(eq(schema.todos.id, id));
```

## CLI

- `djs-core db init` — scaffold `db/`
- `djs-core db generate` — generate migrations
- `djs-core db migrate` — apply migrations
- `djs-core db push | studio | pull` — Drizzle Kit passthrough

Drizzle Kit config is synced from `djs.config.ts` — no separate `drizzle.config.ts`.
