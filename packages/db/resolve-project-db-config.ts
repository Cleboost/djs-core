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

const ALLOWED_DB_KEYS = new Set(["dialect", "url", "autoMigrate"]);

function isSafeDbObjectLiteral(source: string): boolean {
	return !/[`]|=>|\bfunction\b|\bimport\b|\brequire\b|\beval\b|Function\s*\(/.test(
		source,
	);
}

function objectLiteralToJson(source: string): string {
	const withoutTrailingCommas = source.replace(/,(\s*[}\]])/g, "$1");
	return withoutTrailingCommas.replace(
		/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g,
		'$1"$2":',
	);
}

function parseDbObjectLiteral(literal: string): DbConfig | undefined {
	const sanitized = substituteProcessEnv(stripComments(literal));
	if (!isSafeDbObjectLiteral(sanitized)) return undefined;

	try {
		const value = JSON.parse(objectLiteralToJson(sanitized));
		return normalizeDbConfig(value);
	} catch {
		return undefined;
	}
}

function normalizeDbConfig(db: unknown): DbConfig | undefined {
	if (!db || typeof db !== "object" || Array.isArray(db)) {
		return undefined;
	}

	const record = db as Record<string, unknown>;
	for (const key of Object.keys(record)) {
		if (!ALLOWED_DB_KEYS.has(key)) return undefined;
	}

	const config: DbConfig = {};

	if ("dialect" in record) {
		if (
			typeof record.dialect !== "string" ||
			!VALID_DIALECTS.has(record.dialect as DbDialect)
		) {
			return undefined;
		}
		config.dialect = record.dialect as DbDialect;
	}

	if ("url" in record) {
		if (typeof record.url !== "string") return undefined;
		config.url = record.url;
	}

	if ("autoMigrate" in record) {
		if (typeof record.autoMigrate !== "boolean") return undefined;
		config.autoMigrate = record.autoMigrate;
	}

	return config;
}

export function parseDbConfigFromSource(source: string): DbConfig | undefined {
	const literal = extractDbObjectLiteral(source);
	if (!literal) return undefined;
	return parseDbObjectLiteral(literal);
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

export async function resolveProjectDbDialect(
	root: string,
): Promise<DbDialect> {
	const db = await resolveProjectDbConfig(root);
	return db?.dialect ?? "sqlite";
}
