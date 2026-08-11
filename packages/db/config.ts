export type DbDialect = "sqlite" | "postgresql" | "mysql" | "turso";

export interface DbConfig {
	/**
	 * Database dialect.
	 * @default "sqlite"
	 */
	dialect?: DbDialect;
	/**
	 * Connection URL.
	 * - SQLite: file path, e.g. `.djscore/db.sqlite`
	 * - PostgreSQL / MySQL / Turso: connection string or `DATABASE_URL` env var
	 * @default ".djscore/db.sqlite" (sqlite only)
	 */
	url?: string;
	/**
	 * Automatically run pending migrations on bot startup.
	 * @default false
	 */
	autoMigrate?: boolean;
}

export const DEFAULT_SCHEMA_PATH = "db/schema.ts";
export const DEFAULT_MIGRATIONS_FOLDER = "db/migrations";
export const DEFAULT_SQLITE_URL = ".djscore/db.sqlite";
