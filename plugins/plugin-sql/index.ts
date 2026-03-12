import { Database } from "bun:sqlite";
import { definePlugin } from "@djs-core/runtime";

export interface SqlConfig {
	/** Path to the SQLite database file. Use ":memory:" for in-memory DB. */
	path: string;
}

export const sqlPlugin = definePlugin({
	name: "sql",
	setup: (_client, config: SqlConfig) => {
		const db = new Database(config.path);

		return {
			/**
			 * Execute a raw SQL query.
			 */
			// biome-ignore lint/suspicious/noExplicitAny: raw SQL params
			execute: (query: string, params: any[] = []) => {
				return db.query(query).all(...params);
			},
			/**
			 * Execute a SQL statement and return no results.
			 */
			// biome-ignore lint/suspicious/noExplicitAny: raw SQL params
			run: (query: string, params: any[] = []) => {
				return db.run(query, ...params);
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
      execute: (query: string, params?: any[]) => any[];
      run: (query: string, params?: any[]) => void;
      close: () => void;
    };
  }
}
`;
	},
});
