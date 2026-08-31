import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { dirname, join } from "path";

declare global {
	var __djsCoreDataStore: Database | undefined;
}

const DEFAULT_TTL_MINUTES = 120;

let _dataStore: Database | null = null;
let _cleanupInterval: ReturnType<typeof setInterval> | null = null;

type DataStoreStatements = {
	insert: ReturnType<Database["prepare"]>;
	select: ReturnType<Database["prepare"]>;
	deleteByToken: ReturnType<Database["prepare"]>;
	deleteExpired: ReturnType<Database["prepare"]>;
};

let _statements: DataStoreStatements | null = null;

function createStatements(db: Database): DataStoreStatements {
	return {
		insert: db.prepare(
			"INSERT OR REPLACE INTO interaction_data (token, data, created_at, expires_at) VALUES (?, ?, ?, ?)",
		),
		select: db.prepare(
			"SELECT data, expires_at FROM interaction_data WHERE token = ?",
		),
		deleteByToken: db.prepare("DELETE FROM interaction_data WHERE token = ?"),
		deleteExpired: db.prepare(
			"DELETE FROM interaction_data WHERE expires_at > 0 AND expires_at < ?",
		),
	};
}

function getStatements(): DataStoreStatements {
	getOrInitDataStore();
	return _statements as DataStoreStatements;
}

function getOrInitDataStore(): Database {
	if (_dataStore) return _dataStore;

	if (globalThis.__djsCoreDataStore) {
		_dataStore = globalThis.__djsCoreDataStore;
		_statements ??= createStatements(_dataStore);
		return _dataStore;
	}

	const cwd = process.cwd();
	const isBundled =
		process.env.DJS_BUNDLED === "true" ||
		(Bun.main.endsWith("index.js") && dirname(Bun.main) === cwd);

	let dbPath: string;
	if (process.env.DJS_DB_PATH) {
		dbPath = process.env.DJS_DB_PATH;
	} else if (process.env.NODE_ENV === "test") {
		dbPath = ":memory:";
	} else if (isBundled) {
		dbPath = join(cwd, "djscore.db");
	} else {
		const dbDir = join(cwd, ".djscore");
		dbPath = join(dbDir, "djscore.db");
		try {
			mkdirSync(dbDir, { recursive: true });
		} catch {}
	}

	const db = new Database(dbPath);

	db.run(`
		CREATE TABLE IF NOT EXISTS interaction_data (
			token TEXT PRIMARY KEY,
			data TEXT NOT NULL,
			created_at INTEGER NOT NULL DEFAULT (unixepoch()),
			expires_at INTEGER NOT NULL
		)
	`);
	db.run(
		`CREATE INDEX IF NOT EXISTS idx_interaction_data_created_at ON interaction_data(created_at)`,
	);
	db.run(
		`CREATE INDEX IF NOT EXISTS idx_interaction_data_expires_at ON interaction_data(expires_at)`,
	);

	globalThis.__djsCoreDataStore = db;
	_dataStore = db;
	_statements = createStatements(db);

	cleanupExpiredTokens();
	_cleanupInterval = setInterval(() => cleanupExpiredTokens(), 60 * 1000);
	_cleanupInterval.unref?.();

	return _dataStore;
}

export function closeDataStore(): void {
	if (_cleanupInterval) {
		clearInterval(_cleanupInterval);
		_cleanupInterval = null;
	}
	if (_dataStore) {
		_dataStore.close();
		_dataStore = null;
		_statements = null;
		globalThis.__djsCoreDataStore = undefined;
	}
}

/**
 * Stores data associated with an interaction token.
 */
export function storeInteractionData(
	token: string,
	data: unknown,
	ttlMinutes?: number,
): void {
	const statements = getStatements();
	const jsonData = JSON.stringify(data);
	const now = Math.floor(Date.now() / 1000);
	const ttl = ttlMinutes ?? DEFAULT_TTL_MINUTES;
	const expiresAt = ttl === 0 ? 0 : now + ttl * 60;

	statements.insert.run(token, jsonData, now, expiresAt);
}

/**
 * Retrieves data associated with an interaction token.
 * Returns null if the token was never stored, or { data, expired } otherwise.
 */
export function getInteractionData(
	token: string,
): { data: unknown; expired: boolean } | null {
	const statements = getStatements();
	const result = statements.select.get(token) as
		| { data: string; expires_at: number }
		| undefined;

	if (!result) return null;

	const now = Math.floor(Date.now() / 1000);
	if (result.expires_at > 0 && result.expires_at < now) {
		deleteInteractionData(token);
		return { data: undefined, expired: true };
	}

	try {
		return { data: JSON.parse(result.data), expired: false };
	} catch {
		return { data: undefined, expired: false };
	}
}

function deleteInteractionData(token: string): void {
	getStatements().deleteByToken.run(token);
}

function cleanupExpiredTokens(): number {
	const now = Math.floor(Date.now() / 1000);
	const result = getStatements().deleteExpired.run(now);
	return result.changes;
}
