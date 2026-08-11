import type { DbConfig } from "../config";

type Schema = Record<string, unknown>;

export async function createPostgresDb(
	_config: DbConfig,
	schema: Schema,
	url: string,
	// biome-ignore lint/suspicious/noExplicitAny: drizzle db type depends on schema
): Promise<any> {
	const postgres = await import("postgres");
	const { drizzle } = await import("drizzle-orm/postgres-js");
	return drizzle(postgres.default(url), { schema });
}
