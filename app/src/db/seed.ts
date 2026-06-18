import Database from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { products } from "./schema";

const db = drizzle(new Database(".djscore/drizzle.db"));

await db.insert(products).values([
	{ name: "Health Potion", price: 50, stock: 20 },
	{ name: "Iron Sword", price: 150, stock: 5 },
	{ name: "Magic Staff", price: 300, stock: 3 },
	{ name: "Shield", price: 120, stock: 8 },
	{ name: "Elixir", price: 200, stock: 10 },
]);

console.log("✅ Shop seeded with 5 products.");
