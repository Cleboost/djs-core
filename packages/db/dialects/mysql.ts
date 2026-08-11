import type { DbConfig } from "../config";

type Schema = Record<string, unknown>;

export async function createMysqlDb(
	_config: DbConfig,
	schema: Schema,
	url: string,
	// biome-ignore lint/suspicious/noExplicitAny: drizzle db type depends on schema
): Promise<any> {
	const { createPool } = await import("mysql2/promise");
	const { drizzle } = await import("drizzle-orm/mysql2");
	return drizzle(createPool(url), { schema, mode: "default" });
}
