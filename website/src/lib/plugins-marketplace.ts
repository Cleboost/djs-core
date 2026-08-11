export interface MarketplacePlugin {
	id: string;
	name: string;
	package: string;
	version: string;
	description: string;
	icon: string;
	tags: string[];
	install: string;
	npm: string;
	docs?: string;
	accent: string;
	category: string;
	highlights: string[];
}

export const marketplacePlugins: MarketplacePlugin[] = [
	{
		id: "drizzle",
		name: "Drizzle ORM",
		package: "@djs-core/plugin-drizzle",
		version: "1.0.2",
		description:
			"Full Drizzle ORM integration with schema migrations, Drizzle Studio, and multi-dialect support on client.drizzle.",
		icon: "layers",
		tags: ["SQLite", "PostgreSQL", "MySQL", "Turso"],
		install: "djs-core plugin install @djs-core/plugin-drizzle",
		npm: "https://www.npmjs.com/package/@djs-core/plugin-drizzle",
		docs: "https://github.com/Cleboost/djs-core/tree/master/plugins/plugin-drizzle",
		accent: "#f97316",
		category: "Database",
		highlights: [
			"Auto-scaffolds schema & drizzle.config.ts",
			"CLI: generate, migrate, push, studio",
			"Fully typed queries on your schema",
		],
	},
	{
		id: "prisma",
		name: "Prisma SQLite",
		package: "@djs-core/plugin-prisma-sqlite",
		version: "1.0.2",
		description:
			"Prisma 7 with Bun's native SQLite adapter — bundle into a single executable, no Rust query engine binaries.",
		icon: "database",
		tags: ["SQLite", "Prisma", "Bundleable"],
		install: "djs-core plugin install @djs-core/plugin-prisma-sqlite",
		npm: "https://www.npmjs.com/package/@djs-core/plugin-prisma-sqlite",
		docs: "https://github.com/Cleboost/djs-core/tree/master/plugins/plugin-prisma-sqlite",
		accent: "#2dd4bf",
		category: "Database",
		highlights: [
			"Uses bun:sqlite via prisma-adapter-bun-sqlite",
			"Works with bun build --compile",
			"client.prisma fully typed from your schema",
		],
	},
	{
		id: "sql",
		name: "Bun SQL",
		package: "@djs-core/plugin-sql",
		version: "2.0.2",
		description:
			"Minimal raw SQL on Bun SQLite — no ORM, no boilerplate. Tagged templates keep queries parameterized and safe.",
		icon: "zap",
		tags: ["SQLite", "Raw SQL", "Lightweight"],
		install: "djs-core plugin install @djs-core/plugin-sql",
		npm: "https://www.npmjs.com/package/@djs-core/plugin-sql",
		accent: "#5865f2",
		category: "Database",
		highlights: [
			"client.sql.execute`SELECT ...`",
			"Zero extra dependencies",
			"Perfect for simple persistence",
		],
	},
];
