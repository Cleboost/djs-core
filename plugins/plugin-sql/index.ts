import { Database } from "bun:sqlite";
import { definePlugin } from "@djs-core/runtime";
import packageJson from "./package.json" with { type: "json" };

export interface SqlConfig {
	/** Path to the SQLite database file. Use ":memory:" for in-memory DB. */
	path: string;
}

export const sqlPlugin = definePlugin({
	name: "sql",
	packageName: packageJson.name,
	setup: (_client, config: SqlConfig) => {
		console.warn(
			"[@djs-core/plugin-sql] Deprecated: use native db in djs.config.ts and client.db (see https://djs-core.cleboost.com/guides/migrate-db-plugins).",
		);
		const db = new Database(config.path);

		return {
			/**
			 * Execute a raw SQL query using tagged template literals.
			 *
			 * MUST be called as a tagged template — interpolated values are passed
			 * as bound parameters and never concatenated into the SQL string.
			 *
			 * ✅ Safe:   client.sql.execute`SELECT * FROM users WHERE id = ${id}`
			 * ❌ Unsafe: client.sql.execute(`SELECT * FROM users WHERE id = ${id}`)
			 *
			 * Calling it as a regular function bypasses parameterization and
			 * allows SQL injection.
			 */
			// biome-ignore lint/suspicious/noExplicitAny: raw SQL params
			execute: (strings: TemplateStringsArray, ...params: any[]) => {
				return db.query(strings.join("?")).all(...params);
			},
			/**
			 * Execute a SQL statement and return no results using tagged template literals.
			 *
			 * MUST be called as a tagged template — see `execute` for details.
			 *
			 * ✅ Safe:   client.sql.run`INSERT INTO logs (msg) VALUES (${msg})`
			 * ❌ Unsafe: client.sql.run(`INSERT INTO logs (msg) VALUES (${msg})`)
			 */
			// biome-ignore lint/suspicious/noExplicitAny: raw SQL params
			run: (strings: TemplateStringsArray, ...params: any[]) => {
				return db.run(strings.join("?"), ...params);
			},
			/**
			 * Close the database connection.
			 */
			close: () => {
				db.close();
			},
		};
	},
	types: () => {
		return `declare module "@djs-core/runtime" {
  interface PluginsExtensions {
    sql: {
      execute: (strings: TemplateStringsArray, ...params: any[]) => any[];
      run: (strings: TemplateStringsArray, ...params: any[]) => void;
      close: () => void;
    };
  }
}
`;
	},
});
