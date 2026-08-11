import type { DbConfig } from "@djs-core/db";
import { runtimeLog } from "./utils/logger";

type DbClientHost = {
	db?: unknown;
};

export async function prepareClientDb(
	client: DbClientHost,
	dbConfig: DbConfig,
): Promise<void> {
	const { createDb, migrateDb } = await import("@djs-core/db/runtime");
	client.db = await createDb(dbConfig);
	if (dbConfig.autoMigrate) {
		await migrateDb(client.db, dbConfig);
	}
	runtimeLog.success("Database ready");
}
