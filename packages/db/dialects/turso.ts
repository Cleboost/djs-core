import type { DbConfig } from "../config";

type Schema = Record<string, unknown>;

export async function createTursoDb(
	_config: DbConfig,
	schema: Schema,
	url: string,
	// biome-ignore lint/suspicious/noExplicitAny: drizzle db type depends on schema
): Promise<any> {
	const { createClient } = await import("@libsql/client");
	const { drizzle } = await import("drizzle-orm/libsql");
	return drizzle(
		createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }),
		{ schema },
	);
}
