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
			 * Execute a raw SQL query using tagged templates.
			 */
			// biome-ignore lint/suspicious/noExplicitAny: raw SQL params
			execute: (strings: TemplateStringsArray, ...params: any[]) => {
				return db.query(strings.join("?")).all(...params);
			},
			/**
			 * Execute a SQL statement and return no results using tagged templates.
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
