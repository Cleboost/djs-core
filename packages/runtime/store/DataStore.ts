import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { dirname, join } from "path";

declare global {
	var __djsCoreDataStore: Database | undefined;
}

function getDatabase(): Database {
	if (globalThis.__djsCoreDataStore) {
		return globalThis.__djsCoreDataStore;
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

	db.run(`
		CREATE TABLE IF NOT EXISTS button_data (
			token TEXT PRIMARY KEY,
			data TEXT NOT NULL,
			created_at INTEGER NOT NULL DEFAULT (unixepoch()),
			expires_at INTEGER NOT NULL
		)
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS select_menu_data (
			token TEXT PRIMARY KEY,
			data TEXT NOT NULL,
			created_at INTEGER NOT NULL DEFAULT (unixepoch()),
			expires_at INTEGER NOT NULL
		)
	`);

	db.run(`
		CREATE INDEX IF NOT EXISTS idx_button_data_created_at ON button_data(created_at)
	`);
	db.run(`
		CREATE INDEX IF NOT EXISTS idx_button_data_expires_at ON button_data(expires_at)
	`);
	db.run(`
		CREATE INDEX IF NOT EXISTS idx_select_menu_data_created_at ON select_menu_data(created_at)
	`);
	db.run(`
		CREATE INDEX IF NOT EXISTS idx_select_menu_data_expires_at ON select_menu_data(expires_at)
	`);

	globalThis.__djsCoreDataStore = db;
	return db;
}

export const dataStore = getDatabase();

export function storeButtonData(
	token: string,
	data: unknown,
	ttlMinutes?: number,
): void {
	const db = dataStore;
	const jsonData = JSON.stringify(data);
	const now = Math.floor(Date.now() / 1000);

	const ttl = ttlMinutes ?? 120;
	const expiresAt = ttl === 0 ? 0 : now + ttl * 60;

	db.prepare(
		"INSERT OR REPLACE INTO button_data (token, data, created_at, expires_at) VALUES (?, ?, ?, ?)",
	).run(token, jsonData, now, expiresAt);
}

export function getButtonData(token: string): unknown | undefined {
	const db = dataStore;
	const result = db
		.prepare("SELECT data, expires_at FROM button_data WHERE token = ?")
		.get(token) as { data: string; expires_at: number } | undefined;

	if (!result) {
		return undefined;
	}

	const now = Math.floor(Date.now() / 1000);
	if (result.expires_at > 0 && result.expires_at < now) {
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
	const db = dataStore;
	db.prepare("DELETE FROM button_data WHERE token = ?").run(token);
}

export function storeSelectMenuData(
	token: string,
	data: unknown,
	ttlMinutes?: number,
): void {
	const db = dataStore;
	const jsonData = JSON.stringify(data);
	const now = Math.floor(Date.now() / 1000);

	const ttl = ttlMinutes ?? 120;
	const expiresAt = ttl === 0 ? 0 : now + ttl * 60;

	db.prepare(
		"INSERT OR REPLACE INTO select_menu_data (token, data, created_at, expires_at) VALUES (?, ?, ?, ?)",
	).run(token, jsonData, now, expiresAt);
}

export function getSelectMenuData(token: string): unknown | undefined {
	const db = dataStore;
	const result = db
		.prepare("SELECT data, expires_at FROM select_menu_data WHERE token = ?")
		.get(token) as { data: string; expires_at: number } | undefined;

	if (!result) {
		return undefined;
	}

	const now = Math.floor(Date.now() / 1000);
	if (result.expires_at > 0 && result.expires_at < now) {
		deleteSelectMenuData(token);
		return undefined;
	}

	try {
		return JSON.parse(result.data);
	} catch {
		return undefined;
	}
}

export function deleteSelectMenuData(token: string): void {
	const db = dataStore;
	db.prepare("DELETE FROM select_menu_data WHERE token = ?").run(token);
}

export function cleanupExpiredTokens(): number {
	const db = dataStore;
	const now = Math.floor(Date.now() / 1000);
	const buttonResult = db
		.prepare("DELETE FROM button_data WHERE expires_at > 0 AND expires_at < ?")
		.run(now);
	const selectMenuResult = db
		.prepare(
			"DELETE FROM select_menu_data WHERE expires_at > 0 AND expires_at < ?",
		)
		.run(now);
	return buttonResult.changes + selectMenuResult.changes;
}
