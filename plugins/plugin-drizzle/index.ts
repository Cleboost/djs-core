import { spawnSync } from "node:child_process";
import {
	appendFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { definePlugin } from "@djs-core/runtime";
import packageJson from "./package.json" with { type: "json" };

export type DrizzleDialect = "sqlite" | "postgresql" | "mysql" | "turso";

export interface DrizzleConfig {
	/**
	 * Database dialect.
	 * @default "sqlite"
	 */
	dialect?: DrizzleDialect;
	/**
	 * Connection URL.
	 * - SQLite: file path, e.g. `".djscore/drizzle.db"`
	 * - PostgreSQL / MySQL / Turso: connection string or falls back to `DATABASE_URL` env var
	 * @default ".djscore/drizzle.db" (sqlite only)
	 */
	url?: string;
	/**
	 * Path to the schema file (relative to project root).
	 * @default "src/db/schema.ts"
	 */
	schema?: string;
	/**
	 * Path to the migrations folder (relative to project root).
	 * @default "drizzle"
	 */
	migrationsFolder?: string;
	/**
	 * Automatically run pending migrations on bot startup.
	 * ⚠️  Not recommended in production — run migrations explicitly before deploying.
	 * @default false
	 */
	autoMigrate?: boolean;
}

// biome-ignore lint/suspicious/noExplicitAny: db type depends on user-chosen dialect and schema
type AnyDrizzleDb = any;

export const drizzlePlugin = definePlugin({
	name: "drizzle",
	packageName: packageJson.name,
	setup: async (_client, config: DrizzleConfig) => {
		console.warn(
			"[@djs-core/plugin-drizzle] Deprecated: use native db in djs.config.ts and client.db (see djs-core v2 migration).",
		);
		const root = process.cwd();
		const dialect = config.dialect ?? "sqlite";
		const schemaPath = resolve(root, config.schema ?? "src/db/schema.ts");

		if (!existsSync(schemaPath)) {
			throw new Error(
				`[DrizzlePlugin] Schema not found at ${schemaPath}.\n` +
					`Run 'djs-core plugin postinstall @djs-core/plugin-drizzle' to scaffold the schema file.`,
			);
		}

		const schema = await import(schemaPath);

		if (dialect === "sqlite") {
			const url = config.url ?? ".djscore/drizzle.db";
			const dbDir = dirname(resolve(root, url));
			if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

			const { Database } = await import("bun:sqlite");
			const { drizzle } = await import("drizzle-orm/bun-sqlite");
			return drizzle(new Database(resolve(root, url)), {
				schema,
			}) as AnyDrizzleDb;
		}

		if (dialect === "postgresql") {
			const url = config.url ?? process.env.DATABASE_URL;
			if (!url) throw new Error("[DrizzlePlugin] DATABASE_URL is not set.");
			const postgres = await import("postgres");
			const { drizzle } = await import("drizzle-orm/postgres-js");
			return drizzle(postgres.default(url), { schema }) as AnyDrizzleDb;
		}

		if (dialect === "mysql") {
			const url = config.url ?? process.env.DATABASE_URL;
			if (!url) throw new Error("[DrizzlePlugin] DATABASE_URL is not set.");
			const { createPool } = await import("mysql2/promise");
			const { drizzle } = await import("drizzle-orm/mysql2");
			return drizzle(createPool(url), {
				schema,
				mode: "default",
			}) as AnyDrizzleDb;
		}

		if (dialect === "turso") {
			const url = config.url ?? process.env.DATABASE_URL;
			if (!url) throw new Error("[DrizzlePlugin] DATABASE_URL is not set.");
			const { createClient } = await import("@libsql/client");
			const { drizzle } = await import("drizzle-orm/libsql");
			return drizzle(
				createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }),
				{ schema },
			) as AnyDrizzleDb;
		}

		throw new Error(`[DrizzlePlugin] Unknown dialect: "${dialect}".`);
	},

	onReady: async (_client, config: DrizzleConfig, db: AnyDrizzleDb) => {
		if (!config.autoMigrate) return;

		const dialect = config.dialect ?? "sqlite";
		const root = process.cwd();
		const migrationsFolder = resolve(
			root,
			config.migrationsFolder ?? "drizzle",
		);

		if (!existsSync(migrationsFolder)) {
			console.warn(
				"[DrizzlePlugin] autoMigrate is enabled but no migrations folder found. " +
					"Run 'djs-core drizzle generate' first.",
			);
			return;
		}

		if (dialect === "sqlite") {
			const { migrate } = await import("drizzle-orm/bun-sqlite/migrator");
			await migrate(db, { migrationsFolder });
			return;
		}

		if (dialect === "postgresql") {
			const { migrate } = await import("drizzle-orm/postgres-js/migrator");
			await migrate(db, { migrationsFolder });
			return;
		}

		if (dialect === "mysql") {
			const { migrate } = await import("drizzle-orm/mysql2/migrator");
			await migrate(db, { migrationsFolder });
			return;
		}

		if (dialect === "turso") {
			const { migrate } = await import("drizzle-orm/libsql/migrator");
			await migrate(db, { migrationsFolder });
		}
	},

	// biome-ignore lint/suspicious/noExplicitAny: cli definition
	cli: (cli: any) => {
		cli
			.command("drizzle <action>", "Drizzle ORM helper commands")
			.action((action: string) => {
				const kits: Record<string, string[]> = {
					generate: ["drizzle-kit", "generate"],
					migrate: ["drizzle-kit", "migrate"],
					push: ["drizzle-kit", "push"],
					studio: ["drizzle-kit", "studio"],
					pull: ["drizzle-kit", "pull"],
				};

				const args = kits[action];
				if (!args) {
					console.error(`\nUnknown drizzle action: ${action}`);
					console.log(`Available actions: ${Object.keys(kits).join(", ")}\n`);
					process.exit(1);
				}

				const result = spawnSync("bunx", args, { stdio: "inherit" });
				process.exit(result.status ?? 1);
			});
	},

	types: async ({ root }) => {
		const dialect = await resolveDialectFromConfig(root);

		const dialectTypeMap: Record<DrizzleDialect, string> = {
			sqlite: `import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schema from "./src/db/schema";

declare module "@djs-core/runtime" {
  interface PluginsExtensions {
    drizzle: BunSQLiteDatabase<typeof schema>;
  }
}
`,
			postgresql: `import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "./src/db/schema";

declare module "@djs-core/runtime" {
  interface PluginsExtensions {
    drizzle: NodePgDatabase<typeof schema>;
  }
}
`,
			mysql: `import type { MySql2Database } from "drizzle-orm/mysql2";
import type * as schema from "./src/db/schema";

declare module "@djs-core/runtime" {
  interface PluginsExtensions {
    drizzle: MySql2Database<typeof schema>;
  }
}
`,
			turso: `import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "./src/db/schema";

declare module "@djs-core/runtime" {
  interface PluginsExtensions {
    drizzle: LibSQLDatabase<typeof schema>;
  }
}
`,
		};

		return dialectTypeMap[dialect];
	},

	postinstall: async ({ root }) => {
		const dialect = await resolveDialectFromConfig(root);

		// Create src/db/
		const dbDir = resolve(root, "src/db");
		if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

		// schema.ts — dialect-specific starter
		const schemaPath = resolve(dbDir, "schema.ts");
		if (!existsSync(schemaPath)) {
			writeFileSync(schemaPath, schemaTemplates[dialect]);
		}

		// drizzle.config.ts
		const drizzleConfigPath = resolve(root, "drizzle.config.ts");
		if (!existsSync(drizzleConfigPath)) {
			writeFileSync(drizzleConfigPath, drizzleConfigTemplates[dialect]);
		}

		// .gitignore — only relevant for SQLite
		if (dialect === "sqlite") {
			const gitignorePath = resolve(root, ".gitignore");
			const dbLine = ".djscore/drizzle.db";
			if (existsSync(gitignorePath)) {
				const content = readFileSync(gitignorePath, "utf-8");
				if (!content.includes(dbLine)) {
					appendFileSync(gitignorePath, `\n# Drizzle database\n${dbLine}\n`);
				}
			} else {
				writeFileSync(gitignorePath, `# Drizzle database\n${dbLine}\n`);
			}
		}

		console.log("\nDrizzle plugin scaffolded!");
		if (dialect !== "sqlite") {
			console.log("  → Set DATABASE_URL in your .env file");
		}
		console.log("  1. Edit src/db/schema.ts to define your tables");
		console.log("  2. Run: djs-core drizzle generate");
		console.log("  3. Run: djs-core drizzle migrate");
		console.log("  4. Access your DB via client.drizzle in any command\n");
	},
});

async function resolveDialectFromConfig(root: string): Promise<DrizzleDialect> {
	try {
		const configPath = resolve(root, "djs.config.ts");
		if (!existsSync(configPath)) return "sqlite";
		const mod = await import(configPath);
		const dialect = mod.default?.pluginsConfig?.drizzle?.dialect;
		if (
			dialect &&
			["sqlite", "postgresql", "mysql", "turso"].includes(dialect)
		) {
			return dialect as DrizzleDialect;
		}
	} catch {}
	return "sqlite";
}

const schemaTemplates: Record<DrizzleDialect, string> = {
	sqlite: `import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	createdAt: int({ mode: "timestamp" })
		.$defaultFn(() => new Date())
		.notNull(),
});
`,
	postgresql: `import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: serial().primaryKey(),
	name: text().notNull(),
	createdAt: timestamp().defaultNow().notNull(),
});
`,
	mysql: `import { int, mysqlTable, text, timestamp } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
	id: int().primaryKey().autoincrement(),
	name: text().notNull(),
	createdAt: timestamp().defaultNow().notNull(),
});
`,
	turso: `import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	createdAt: int({ mode: "timestamp" })
		.$defaultFn(() => new Date())
		.notNull(),
});
`,
};

const drizzleConfigTemplates: Record<DrizzleDialect, string> = {
	sqlite: `import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "sqlite",
	dbCredentials: {
		url: ".djscore/drizzle.db",
	},
});
`,
	postgresql: `import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
`,
	mysql: `import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "mysql",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
`,
	turso: `import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "turso",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
		authToken: process.env.TURSO_AUTH_TOKEN,
	},
});
`,
};
