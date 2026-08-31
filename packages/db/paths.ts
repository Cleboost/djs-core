import { join } from "node:path";

export function resolveMigrationsFolder(root: string): string {
	return join(root, "db", "migrations");
}

export function resolveSchemaPath(root: string): string {
	return join(root, "db", "schema.ts");
}

let explicitDbRoot: string | undefined;

export function setDbRoot(root: string): void {
	explicitDbRoot = root;
}

export function clearDbRoot(): void {
	explicitDbRoot = undefined;
}

/** Project root for DB paths: dev = bot root, bundled prod = dist (cwd). */
export function getDbRoot(): string {
	return explicitDbRoot ?? process.cwd();
}
