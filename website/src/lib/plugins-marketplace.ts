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
	deprecated?: boolean;
	replacement?: string;
}

export const marketplacePlugins: MarketplacePlugin[] = [
	{
		id: "drizzle",
		name: "Drizzle ORM",
		package: "@djs-core/plugin-drizzle",
		version: "1.0.3",
		description:
			"Deprecated — use native db: config and client.db instead. See migration guide.",
		icon: "layers",
		tags: ["Deprecated"],
		install: "Use native db: in djs.config.ts",
		npm: "https://www.npmjs.com/package/@djs-core/plugin-drizzle",
		docs: "/guides/migrate-db-plugins",
		accent: "#94a3b8",
		category: "Database",
		highlights: [
			"Replaced by built-in @djs-core/db",
			"client.drizzle → client.db",
			"djs-core drizzle → djs-core db",
		],
		deprecated: true,
		replacement: "/essentials/database",
	},
	{
		id: "prisma",
		name: "Prisma SQLite",
		package: "@djs-core/plugin-prisma-sqlite",
		version: "1.0.3",
		description:
			"Deprecated — migrate to native Drizzle DB or use Prisma directly without this plugin.",
		icon: "database",
		tags: ["Deprecated"],
		install: "Use native db: in djs.config.ts",
		npm: "https://www.npmjs.com/package/@djs-core/plugin-prisma-sqlite",
		docs: "/guides/migrate-db-plugins",
		accent: "#94a3b8",
		category: "Database",
		highlights: [
			"No official plugin maintenance",
			"See migration guide for Drizzle path",
		],
		deprecated: true,
		replacement: "/essentials/database",
	},
	{
		id: "sql",
		name: "Bun SQL",
		package: "@djs-core/plugin-sql",
		version: "2.0.3",
		description:
			"Deprecated — use native client.db with Drizzle queries instead of raw SQL.",
		icon: "zap",
		tags: ["Deprecated"],
		install: "Use native db: in djs.config.ts",
		npm: "https://www.npmjs.com/package/@djs-core/plugin-sql",
		docs: "/guides/migrate-db-plugins",
		accent: "#94a3b8",
		category: "Database",
		highlights: [
			"client.sql → client.db",
			"Schema via db/schema.ts + migrations",
		],
		deprecated: true,
		replacement: "/essentials/database",
	},
];
