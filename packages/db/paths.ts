import { join } from "node:path";

export function resolveMigrationsFolder(root: string): string {
	return join(root, "db", "migrations");
}

export function resolveSchemaPath(root: string): string {
	return join(root, "db", "schema.ts");
}

/** Project root for DB paths: dev = bot root, bundled prod = dist (cwd). */
export function getDbRoot(): string {
	return process.cwd();
}
