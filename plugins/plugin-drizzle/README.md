# @djs-core/plugin-drizzle

Drizzle ORM integration for djs-core. Supports SQLite, PostgreSQL, MySQL, and Turso with full type safety on `client.drizzle`.

## Installation

```bash
djs-core plugin install @djs-core/plugin-drizzle
```

This will:
- Add the plugin to your `djs.config.ts`
- Create `src/db/schema.ts` with a starter schema
- Create `drizzle.config.ts` configured for your dialect
- Add the database file to `.gitignore` (SQLite only)

## Setup

### 1. Configure the plugin

```ts
// djs.config.ts
import { defineConfig } from "@djs-core/runtime";

export default defineConfig({
  token: process.env.TOKEN!,
  servers: [],
  plugins: [import("@djs-core/plugin-drizzle")],
  pluginsConfig: {
    drizzle: {
      dialect: "sqlite", // "sqlite" | "postgresql" | "mysql" | "turso"
    },
  },
});
```

### 2. Define your schema

```ts
// src/db/schema.ts
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  createdAt: int({ mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});
```

### 3. Generate and run migrations

```bash
djs-core drizzle generate   # generate SQL migration files
djs-core drizzle migrate    # apply migrations to the database
```

### 4. Use in your commands

```ts
// src/interactions/commands/users/list.ts
import { Command } from "@djs-core/runtime";
import * as schema from "../../../db/schema";

export default new Command()
  .setName("users")
  .setDescription("List all users")
  .run(async (interaction) => {
    const users = await interaction.client.drizzle
      .select()
      .from(schema.users);

    await interaction.reply({
      content: users.map((u) => u.name).join("\n") || "No users found.",
    });
  });
```

## Dialects

### SQLite (default)

No extra dependencies needed — uses Bun's native SQLite driver.

```ts
pluginsConfig: {
  drizzle: {
    dialect: "sqlite",
    url: ".djscore/drizzle.db", // optional, this is the default
  },
},
```

### PostgreSQL

```bash
bun add postgres
```

```ts
pluginsConfig: {
  drizzle: {
    dialect: "postgresql",
    url: process.env.DATABASE_URL, // or set DATABASE_URL in .env
  },
},
```

```ts
// src/db/schema.ts
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial().primaryKey(),
  name: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});
```

### MySQL

```bash
bun add mysql2
```

```ts
pluginsConfig: {
  drizzle: {
    dialect: "mysql",
    url: process.env.DATABASE_URL,
  },
},
```

```ts
// src/db/schema.ts
import { int, mysqlTable, text, timestamp } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int().primaryKey().autoincrement(),
  name: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});
```

### Turso

```bash
bun add @libsql/client
```

```ts
pluginsConfig: {
  drizzle: {
    dialect: "turso",
    url: process.env.DATABASE_URL, // libsql://your-db.turso.io
    // TURSO_AUTH_TOKEN is read from env automatically
  },
},
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dialect` | `"sqlite" \| "postgresql" \| "mysql" \| "turso"` | `"sqlite"` | Database engine |
| `url` | `string` | `".djscore/drizzle.db"` (sqlite) | Connection URL or file path |
| `schema` | `string` | `"src/db/schema.ts"` | Path to your schema file |
| `migrationsFolder` | `string` | `"drizzle"` | Path to migrations folder |
| `autoMigrate` | `boolean` | `false` | Apply pending migrations on startup |

## CLI commands

| Command | Description |
|---------|-------------|
| `djs-core drizzle generate` | Generate SQL migration files from schema changes |
| `djs-core drizzle migrate` | Apply pending migrations |
| `djs-core drizzle push` | Push schema directly without migration files (dev only) |
| `djs-core drizzle pull` | Pull schema from existing database |
| `djs-core drizzle studio` | Open Drizzle Studio in the browser |

## Auto-migrate

Setting `autoMigrate: true` runs pending migrations automatically when the bot starts.

```ts
pluginsConfig: {
  drizzle: {
    dialect: "sqlite",
    autoMigrate: true, // ⚠️ use with caution in production
  },
},
```

> **Warning** — do not use `autoMigrate` in production without a deployment strategy. Prefer running `djs-core drizzle migrate` as part of your deploy pipeline.

## Type safety

Run `djs-core generate-config-types` after adding or changing the plugin config to regenerate `djs-core.d.ts`. This gives `client.drizzle` the exact type for your schema and dialect.

```ts
// After generation, client.drizzle is fully typed:
const user = await client.drizzle.query.users.findFirst({
  where: (u, { eq }) => eq(u.id, 1),
}); // user: { id: number; name: string; createdAt: Date } | undefined
```
