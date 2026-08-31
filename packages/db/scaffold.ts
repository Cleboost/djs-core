import {
	appendFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import type { DbDialect } from "./config";
import {
	DRIZZLE_CONFIG_STUB,
	writeDrizzleKitConfig,
} from "./drizzle-kit";
import { resolveProjectDbDialect } from "./resolve-project-db-config";

const schemaTemplates: Record<DbDialect, string> = {
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

const drizzleConfigTemplates: Record<DbDialect, string> = {
	sqlite: DRIZZLE_CONFIG_STUB,
	postgresql: DRIZZLE_CONFIG_STUB,
	mysql: DRIZZLE_CONFIG_STUB,
	turso: DRIZZLE_CONFIG_STUB,
};

export function scaffoldDbProject(root: string, dialect: DbDialect = "sqlite") {
	const dbDir = resolve(root, "db");
	if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

	const schemaPath = resolve(dbDir, "schema.ts");
	if (!existsSync(schemaPath)) {
		writeFileSync(schemaPath, schemaTemplates[dialect]);
	}

	const migrationsDir = resolve(dbDir, "migrations");
	if (!existsSync(migrationsDir)) {
		mkdirSync(migrationsDir, { recursive: true });
	}

	const drizzleConfigPath = resolve(root, "drizzle.config.ts");
	if (!existsSync(drizzleConfigPath)) {
		writeFileSync(drizzleConfigPath, drizzleConfigTemplates[dialect]);
	}

	writeDrizzleKitConfig(root, { dialect });

	if (dialect === "sqlite") {
		const gitignorePath = resolve(root, ".gitignore");
		const dbLine = ".djscore/db.sqlite";
		if (existsSync(gitignorePath)) {
			const content = readFileSync(gitignorePath, "utf-8");
			if (!content.includes(dbLine)) {
				appendFileSync(gitignorePath, `\n# Database\n${dbLine}\n`);
			}
		} else {
			writeFileSync(gitignorePath, `# Database\n${dbLine}\n`);
		}
	}
}

export async function resolveDbDialectFromConfig(
	root: string,
): Promise<DbDialect> {
	return resolveProjectDbDialect(root);
}
