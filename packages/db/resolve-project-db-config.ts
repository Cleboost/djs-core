import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DbConfig, DbDialect } from "./config";

const VALID_DIALECTS = new Set<DbDialect>([
	"sqlite",
	"postgresql",
	"mysql",
	"turso",
]);

/** Stub env so optional dynamic import fallback can load djs.config.ts safely. */
const CONFIG_STUB_ENV: Record<string, string> = {
	TOKEN: "djs-core-internal-config-stub",
	DATABASE_URL: "postgresql://localhost:5432/djs-core-stub",
	TURSO_AUTH_TOKEN: "djs-core-stub",
};

function restoreEnv(snapshot: Map<string, string | undefined>): void {
	for (const [key, prev] of snapshot) {
		if (prev === undefined) delete process.env[key];
		else process.env[key] = prev;
	}
}

function applyConfigStubEnv(): Map<string, string | undefined> {
	const snapshot = new Map<string, string | undefined>();
	for (const [key, value] of Object.entries(CONFIG_STUB_ENV)) {
		snapshot.set(key, process.env[key]);
		process.env[key] = value;
	}
	return snapshot;
}

function stripComments(source: string): string {
	return source
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function extractDbObjectLiteral(source: string): string | undefined {
	const match = source.match(/\bdb\s*:\s*\{/);
	if (!match || match.index === undefined) return undefined;

	let depth = 0;
	const start = match.index + match[0].length - 1;

	for (let i = start; i < source.length; i++) {
		const ch = source[i];
		if (ch === "{") depth++;
		else if (ch === "}") {
			depth--;
			if (depth === 0) return source.slice(start, i + 1);
		}
	}

	return undefined;
}

function substituteProcessEnv(source: string): string {
	return source.replace(/process\.env\.([A-Z0-9_]+)/g, (_, name: string) => {
		const value =
			process.env[name] ?? CONFIG_STUB_ENV[name] ?? `djs-core-stub-${name}`;
		return JSON.stringify(value);
	});
}

function parseDbObjectLiteral(literal: string): DbConfig | undefined {
	const sanitized = substituteProcessEnv(stripComments(literal));
	try {
		const value = new Function(`return ${sanitized}`)();
		if (!value || typeof value !== "object" || Array.isArray(value)) {
			return undefined;
		}
		return value as DbConfig;
	} catch {
		return undefined;
	}
}

function normalizeDbConfig(db: DbConfig | undefined): DbConfig | undefined {
	if (!db) return undefined;
	if (db.dialect && !VALID_DIALECTS.has(db.dialect)) return undefined;
	return db;
}

function parseDbConfigFromSource(source: string): DbConfig | undefined {
	const literal = extractDbObjectLiteral(source);
	if (!literal) return undefined;
	return normalizeDbConfig(parseDbObjectLiteral(literal));
}

async function importDbConfigFromModule(
	configPath: string,
): Promise<DbConfig | undefined> {
	const snapshot = applyConfigStubEnv();
	try {
		const mod = await import(configPath);
		return normalizeDbConfig(mod.default?.db as DbConfig | undefined);
	} catch {
		return undefined;
	} finally {
		restoreEnv(snapshot);
	}
}

/**
 * Reads `db:` from djs.config.ts without executing top-level side effects when possible.
 * Falls back to a guarded dynamic import with stub env vars (TOKEN, DATABASE_URL, …).
 */
export async function resolveProjectDbConfig(
	root: string,
): Promise<DbConfig | undefined> {
	const configPath = resolve(root, "djs.config.ts");
	if (!existsSync(configPath)) return undefined;

	const source = readFileSync(configPath, "utf-8");
	const staticDb = parseDbConfigFromSource(source);
	if (staticDb) return staticDb;

	return importDbConfigFromModule(configPath);
}

export async function resolveProjectDbDialect(root: string): Promise<DbDialect> {
	const db = await resolveProjectDbConfig(root);
	return db?.dialect ?? "sqlite";
}
