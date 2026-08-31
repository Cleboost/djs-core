import { resolve } from "node:path";
import { createDb, schema, setDbRoot } from "@djs-core/db";

setDbRoot(resolve(import.meta.dir, "../.."));

const db = await createDb({ dialect: "sqlite" });

await db.insert(schema.products).values([
	{ name: "Health Potion", price: 50, stock: 20 },
	{ name: "Iron Sword", price: 150, stock: 5 },
	{ name: "Magic Staff", price: 300, stock: 3 },
	{ name: "Shield", price: 120, stock: 8 },
	{ name: "Elixir", price: 200, stock: 10 },
]);

console.log("✅ Shop seeded with 5 products.");
