import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { dirname, join } from "path";

declare global {
	var __djsCoreDataStore: Database | undefined;
}

const DEFAULT_TTL_MINUTES = 120;

let _dataStore: Database | null = null;
let _cleanupInterval: ReturnType<typeof setInterval> | null = null;

function getOrInitDataStore(): Database {
	if (_dataStore) return _dataStore;

	if (globalThis.__djsCoreDataStore) {
		_dataStore = globalThis.__djsCoreDataStore;
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
	db.run(`CREATE INDEX IF NOT EXISTS idx_interaction_data_created_at ON interaction_data(created_at)`);
	db.run(`CREATE INDEX IF NOT EXISTS idx_interaction_data_expires_at ON interaction_data(expires_at)`);

	globalThis.__djsCoreDataStore = db;
	_dataStore = db;

	cleanupExpiredTokens();
	_cleanupInterval = setInterval(() => cleanupExpiredTokens(), 60 * 1000);

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
	const db = getOrInitDataStore();
	const jsonData = JSON.stringify(data);
	const now = Math.floor(Date.now() / 1000);
	const ttl = ttlMinutes ?? DEFAULT_TTL_MINUTES;
	const expiresAt = ttl === 0 ? 0 : now + ttl * 60;

	db.prepare(
		"INSERT OR REPLACE INTO interaction_data (token, data, created_at, expires_at) VALUES (?, ?, ?, ?)",
	).run(token, jsonData, now, expiresAt);
}

/**
 * Retrieves data associated with an interaction token.
 * Returns null if the token was never stored, or { data, expired } otherwise.
 */
export function getInteractionData(
	token: string,
): { data: unknown; expired: boolean } | null {
	const db = getOrInitDataStore();
	const result = db
		.prepare("SELECT data, expires_at FROM interaction_data WHERE token = ?")
		.get(token) as { data: string; expires_at: number } | undefined;

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
	const db = getOrInitDataStore();
	db.prepare("DELETE FROM interaction_data WHERE token = ?").run(token);
}

function cleanupExpiredTokens(): number {
	const db = getOrInitDataStore();
	const now = Math.floor(Date.now() / 1000);
	const result = db
		.prepare("DELETE FROM interaction_data WHERE expires_at > 0 AND expires_at < ?")
		.run(now);
	return result.changes;
}
