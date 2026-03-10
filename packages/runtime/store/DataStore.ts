import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { dirname, join } from "path";

declare global {
	var __djsCoreDataStore: Database | undefined;
}

const DEFAULT_TTL_MINUTES = 120;

function getDatabase(): Database {
	if (globalThis.__djsCoreDataStore) {
		return globalThis.__djsCoreDataStore;
	}

	const cwd = process.cwd();
	const isBundled = Bun.main.endsWith("index.js") && dirname(Bun.main) === cwd;

	let dbPath: string;
	if (process.env.NODE_ENV === "test") {
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

	// Unified interaction data table
	db.run(`
		CREATE TABLE IF NOT EXISTS interaction_data (
			token TEXT PRIMARY KEY,
			data TEXT NOT NULL,
			created_at INTEGER NOT NULL DEFAULT (unixepoch()),
			expires_at INTEGER NOT NULL
		)
	`);

	db.run(`
		CREATE INDEX IF NOT EXISTS idx_interaction_data_created_at ON interaction_data(created_at)
	`);
	db.run(`
		CREATE INDEX IF NOT EXISTS idx_interaction_data_expires_at ON interaction_data(expires_at)
	`);

	globalThis.__djsCoreDataStore = db;
	return db;
}

const dataStore = getDatabase();

/**
 * Stores data associated with an interaction token.
 * @param token - The unique token for this interaction.
 * @param data - The data to store.
 * @param ttlMinutes - Time to live in minutes. Defaults to 120.
 */
export function storeInteractionData(
	token: string,
	data: unknown,
	ttlMinutes?: number,
): void {
	const db = dataStore;
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
 * Automatically deletes the data if it has expired.
 * @param token - The token to retrieve data for.
 * @returns The stored data, or undefined if not found or expired.
 */
export function getInteractionData(token: string): unknown | undefined {
	const db = dataStore;
	const result = db
		.prepare("SELECT data, expires_at FROM interaction_data WHERE token = ?")
		.get(token) as { data: string; expires_at: number } | undefined;

	if (!result) {
		return undefined;
	}

	const now = Math.floor(Date.now() / 1000);
	if (result.expires_at > 0 && result.expires_at < now) {
		deleteInteractionData(token);
		return undefined;
	}

	try {
		return JSON.parse(result.data);
	} catch {
		return undefined;
	}
}

/**
 * Deletes data associated with an interaction token.
 * @param token - The token to delete.
 */
function deleteInteractionData(token: string): void {
	const db = dataStore;
	db.prepare("DELETE FROM interaction_data WHERE token = ?").run(token);
}

/**
 * Cleans up all expired tokens from the database.
 * @returns The number of deleted tokens.
 */
function cleanupExpiredTokens(): number {
	const db = dataStore;
	const now = Math.floor(Date.now() / 1000);
	const result = db
		.prepare(
			"DELETE FROM interaction_data WHERE expires_at > 0 AND expires_at < ?",
		)
		.run(now);
	return result.changes;
}

// Cleanup expired tokens on startup and every minute
cleanupExpiredTokens();
setInterval(() => {
	cleanupExpiredTokens();
}, 60 * 1000);
