import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { DbConfig } from "./config";
import { DEFAULT_SCHEMA_PATH } from "./config";
import { getDbRoot } from "./paths";

// biome-ignore lint/suspicious/noExplicitAny: drizzle client type depends on user schema
export async function createDb(config: DbConfig): Promise<any> {
	const root = getDbRoot();
	const dialect = config.dialect ?? "sqlite";
	const schemaPath = resolve(root, DEFAULT_SCHEMA_PATH);

	if (!existsSync(schemaPath)) {
		throw new Error(
			`[djs-core/db] Schema not found at ${schemaPath}.\n` +
				`Run 'djs-core db init' to scaffold db/schema.ts.`,
		);
	}

	const schema = await import(schemaPath);

	if (dialect === "sqlite") {
		const { createSqliteDb } = await import("./dialects/sqlite");
		return await createSqliteDb(root, config, schema);
	}

	if (dialect === "postgresql") {
		const url = config.url ?? process.env.DATABASE_URL;
		if (!url) throw new Error("[djs-core/db] DATABASE_URL is not set.");
		const { createPostgresDb } = await import("./dialects/postgres");
		return await createPostgresDb(config, schema, url);
	}

	if (dialect === "mysql") {
		const url = config.url ?? process.env.DATABASE_URL;
		if (!url) throw new Error("[djs-core/db] DATABASE_URL is not set.");
		const { createMysqlDb } = await import("./dialects/mysql");
		return await createMysqlDb(config, schema, url);
	}

	if (dialect === "turso") {
		const url = config.url ?? process.env.DATABASE_URL;
		if (!url) throw new Error("[djs-core/db] DATABASE_URL is not set.");
		const { createTursoDb } = await import("./dialects/turso");
		return await createTursoDb(config, schema, url);
	}

	throw new Error(`[djs-core/db] Unknown dialect: "${dialect}".`);
}
