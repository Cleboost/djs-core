import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DbConfig, DbDialect } from "./config";
import { DEFAULT_SQLITE_URL } from "./config";
import { resolveProjectDbConfig } from "./resolve-project-db-config";

const DRIZZLE_KIT_DIALECT: Record<DbDialect, string> = {
	sqlite: "sqlite",
	postgresql: "postgresql",
	mysql: "mysql",
	turso: "turso",
};

export const DRIZZLE_CONFIG_STUB = `// Synced from djs.config.ts via djs-core dev/build.
export { default } from "./.djscore/drizzle.kit.ts";
`;

export function buildDrizzleKitConfigContent(db: DbConfig = {}): string {
	const dialect = db.dialect ?? "sqlite";
	const kitDialect = DRIZZLE_KIT_DIALECT[dialect];

	let credentialsBlock = "";

	if (dialect === "sqlite") {
		const url = db.url ?? DEFAULT_SQLITE_URL;
		credentialsBlock = `dbCredentials: {\n\t\turl: "${url}",\n\t},`;
	} else if (dialect === "turso") {
		credentialsBlock = `dbCredentials: {\n\t\turl: process.env.DATABASE_URL!,\n\t\tauthToken: process.env.TURSO_AUTH_TOKEN,\n\t},`;
	} else {
		credentialsBlock = `dbCredentials: {\n\t\turl: process.env.DATABASE_URL!,\n\t},`;
	}

	return `import { defineConfig } from "drizzle-kit";

// Auto-generated from djs.config.ts. Do not edit manually.
export default defineConfig({
\tschema: "./db/schema.ts",
\tout: "./db/migrations",
\tdialect: "${kitDialect}",
\t${credentialsBlock}
});
`;
}

export function writeDrizzleKitConfig(root: string, db: DbConfig): string {
	const djscoreDir = resolve(root, ".djscore");
	mkdirSync(djscoreDir, { recursive: true });
	const kitPath = resolve(djscoreDir, "drizzle.kit.ts");
	writeFileSync(kitPath, buildDrizzleKitConfigContent(db), "utf-8");
	return kitPath;
}

export async function resolveDbConfigFromProject(
	root: string,
): Promise<DbConfig | undefined> {
	return resolveProjectDbConfig(root);
}

export async function syncDrizzleKitConfig(root: string): Promise<boolean> {
	const db = await resolveProjectDbConfig(root);
	if (!db) return false;
	writeDrizzleKitConfig(root, db);
	return true;
}
