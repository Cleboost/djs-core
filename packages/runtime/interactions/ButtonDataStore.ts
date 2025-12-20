import { Database } from "bun:sqlite";
import { join, dirname } from "path";
import { mkdirSync } from "fs";

declare global {
	var __djsCoreButtonDataStore: Database | undefined;
}

function getDatabase(): Database {
	if (globalThis.__djsCoreButtonDataStore) {
		return globalThis.__djsCoreButtonDataStore;
	}

	const cwd = process.cwd();
	const isBundled = Bun.main.endsWith("index.js") && dirname(Bun.main) === cwd;

	let dbPath: string;
	if (isBundled) {
		dbPath = join(cwd, "djscore.db");
	} else {
		const dbDir = join(cwd, ".djscore");
		dbPath = join(dbDir, "djscore.db");

		try {
			mkdirSync(dbDir, { recursive: true });
		} catch {}
	}

	const db = new Database(dbPath);

	db.exec(`
		CREATE TABLE IF NOT EXISTS button_data (
			token TEXT PRIMARY KEY,
			data TEXT NOT NULL,
			created_at INTEGER NOT NULL DEFAULT (unixepoch()),
			expires_at INTEGER NOT NULL
		)
	`);

	const tableInfo = db
		.prepare("PRAGMA table_info(button_data)")
		.all() as Array<{ name: string }>;
	const hasExpiresAt = tableInfo.some((col) => col.name === "expires_at");

	if (!hasExpiresAt) {
		try {
			db.exec(
				`ALTER TABLE button_data ADD COLUMN expires_at INTEGER NOT NULL DEFAULT 0`,
			);
			db.exec(`UPDATE button_data SET expires_at = 0 WHERE expires_at IS NULL`);
		} catch {}
	}

	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_button_data_created_at ON button_data(created_at)
	`);
	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_button_data_expires_at ON button_data(expires_at)
	`);

	globalThis.__djsCoreButtonDataStore = db;
	return db;
}

export const buttonDataStore = getDatabase();

export function storeButtonData(
	token: string,
	data: unknown,
	ttlMinutes?: number,
): void {
	const db = buttonDataStore;
	const jsonData = JSON.stringify(data);
	const now = Math.floor(Date.now() / 1000);

	const ttl = ttlMinutes ?? 120;
	const expiresAt = ttl === 0 ? 0 : now + ttl * 60;

	db.prepare(
		"INSERT OR REPLACE INTO button_data (token, data, created_at, expires_at) VALUES (?, ?, ?, ?)",
	).run(token, jsonData, now, expiresAt);
}

export function getButtonData(token: string): unknown | undefined {
	const db = buttonDataStore;
	const result = db
		.prepare("SELECT data, expires_at FROM button_data WHERE token = ?")
		.get(token) as { data: string; expires_at: number } | undefined;

	if (!result) {
		return undefined;
	}

	// Vérifier si le token est expiré (expires_at > 0 ET expires_at < now)
	// expires_at = 0 signifie infini
	const now = Math.floor(Date.now() / 1000);
	if (result.expires_at > 0 && result.expires_at < now) {
		// Token expiré, supprimer de la DB et retourner undefined
		deleteButtonData(token);
		return undefined;
	}

	try {
		return JSON.parse(result.data);
	} catch {
		return undefined;
	}
}

export function deleteButtonData(token: string): void {
	const db = buttonDataStore;
	db.prepare("DELETE FROM button_data WHERE token = ?").run(token);
}

export function cleanupExpiredTokens(): number {
	const db = buttonDataStore;
	const now = Math.floor(Date.now() / 1000);
	// Supprimer les tokens expirés (expires_at > 0 ET expires_at < now)
	// expires_at = 0 signifie infini, donc on ne les supprime pas
	const result = db
		.prepare("DELETE FROM button_data WHERE expires_at > 0 AND expires_at < ?")
		.run(now);
	return result.changes;
}
