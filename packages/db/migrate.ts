import { existsSync } from "node:fs";
import type { DbConfig } from "./config";
import { getDbRoot, resolveMigrationsFolder } from "./paths";

// biome-ignore lint/suspicious/noExplicitAny: drizzle db type depends on user schema
type AnyDrizzleDb = any;

export async function migrateDb(
	db: AnyDrizzleDb,
	config: DbConfig,
): Promise<void> {
	const dialect = config.dialect ?? "sqlite";
	const root = getDbRoot();
	const migrationsFolder = resolveMigrationsFolder(root);

	if (!existsSync(migrationsFolder)) {
		throw new Error(
			"[djs-core/db] autoMigrate is enabled but no migrations folder found at db/migrations. " +
				"Run 'djs-core db generate' first.",
		);
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
}
