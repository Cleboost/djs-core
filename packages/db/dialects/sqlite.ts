import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { DbConfig } from "../config";
import { DEFAULT_SQLITE_URL } from "../config";

type Schema = Record<string, unknown>;

export async function createSqliteDb(
	root: string,
	config: DbConfig,
	schema: Schema,
	// biome-ignore lint/suspicious/noExplicitAny: drizzle db type depends on schema
): Promise<any> {
	const url = config.url ?? DEFAULT_SQLITE_URL;
	const dbPath = resolve(root, url);
	const dbDir = dirname(dbPath);
	if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

	const { Database } = await import("bun:sqlite");
	const { drizzle } = await import("drizzle-orm/bun-sqlite");
	return drizzle(new Database(dbPath), { schema });
}
