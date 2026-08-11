import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
	id: int().primaryKey({ autoIncrement: true }),
	task: text().notNull(),
	createdAt: int({ mode: "timestamp" })
		.$defaultFn(() => new Date())
		.notNull(),
});

export const products = sqliteTable("products", {
	id: int().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	price: int().notNull(),
	stock: int().notNull().default(10),
});
