import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const items = sqliteTable("items", {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
});
