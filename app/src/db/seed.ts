import Database from "bun:sqlite";
import { schema } from "@djs-core/db";
import { drizzle } from "drizzle-orm/bun-sqlite";

const db = drizzle(new Database(".djscore/db.sqlite"));

await db.insert(schema.products).values([
	{ name: "Health Potion", price: 50, stock: 20 },
	{ name: "Iron Sword", price: 150, stock: 5 },
	{ name: "Magic Staff", price: 300, stock: 3 },
	{ name: "Shield", price: 120, stock: 8 },
	{ name: "Elixir", price: 200, stock: 10 },
]);

console.log("✅ Shop seeded with 5 products.");
