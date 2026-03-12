import { spawnSync } from "node:child_process";
import {
	appendFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { definePlugin } from "@djs-core/runtime";
import { PrismaBunSqlite } from "prisma-adapter-bun-sqlite";

export interface PrismaConfig {
	/**
	 * Options to pass to the PrismaClient constructor.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: generic options
	options?: any;
}

/**
 * Prisma plugin for djs-core using Bun's native SQLite driver.
 */
export const prismaPlugin = definePlugin({
	name: "prisma",
	setup: async (_client, config: PrismaConfig) => {
		const url = process.env.DATABASE_URL;

		if (!url) {
			throw new Error(
				"[PrismaPlugin] DATABASE_URL environment variable is not set.",
			);
		}

		const adapter = new PrismaBunSqlite({ url });

		let clientPath = resolve(process.cwd(), ".djscore/prisma/index.js");
		if (!existsSync(clientPath)) {
			clientPath = resolve(process.cwd(), ".djscore/prisma/index.ts");
		}
		if (!existsSync(clientPath)) {
			clientPath = resolve(process.cwd(), ".djscore/prisma/client.ts");
		}

		if (!existsSync(clientPath)) {
			throw new Error(
				`[PrismaPlugin] Prisma Client not found at ${clientPath}. Please run 'djs-core prisma generate' first.`,
			);
		}

		const { PrismaClient } = await import(clientPath);

		return new PrismaClient({
			...config.options,
			adapter,
		});
	},
	onReady: async (_client, _config, prisma) => {
		await prisma.$connect();
	},
	// biome-ignore lint/suspicious/noExplicitAny: cli definition
	cli: (cli: any) => {
		cli
			.command("prisma <action>", "Prisma helper commands")
			.action((action: string) => {
				if (action === "generate") {
					spawnSync("bunx", ["prisma", "generate"], {
						stdio: "inherit",
						shell: true,
					});
					process.exit(0);
				}

				if (action === "push") {
					spawnSync("bunx", ["prisma", "db", "push"], {
						stdio: "inherit",
						shell: true,
					});
					process.exit(0);
				}

				console.error(`\nUnknown prisma action: ${action}`);
				console.log("Available actions: generate, push\n");
				process.exit(1);
			});
	},
	postinstall: ({ root }) => {
		const envPath = resolve(root, ".env");
		const dbLine = 'DATABASE_URL="file:./prisma_todos.db"';
		if (existsSync(envPath)) {
			const content = readFileSync(envPath, "utf-8");
			if (!content.includes("DATABASE_URL")) {
				appendFileSync(envPath, `\n${dbLine}\n`);
			}
		} else {
			writeFileSync(envPath, `${dbLine}\n`);
		}

		const prismaConfigPath = resolve(root, "prisma.config.ts");
		if (!existsSync(prismaConfigPath)) {
			writeFileSync(
				prismaConfigPath,
				`import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
`,
			);
		}

		const prismaDir = resolve(root, "prisma");
		if (!existsSync(prismaDir)) {
			mkdirSync(prismaDir, { recursive: true });
		}
		const schemaPath = resolve(prismaDir, "schema.prisma");
		if (!existsSync(schemaPath)) {
			writeFileSync(
				schemaPath,
				`generator client {
  provider   = "prisma-client"
  engineType = "client"
  runtime    = "bun"
  output     = "../.djscore/prisma"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
`,
			);
		}

		const typesDir = resolve(root, ".djscore");
		if (!existsSync(typesDir)) mkdirSync(typesDir, { recursive: true });

		writeFileSync(
			resolve(typesDir, "prisma.d.ts"),
			`import type { PrismaClient } from "./prisma";

declare module "@djs-core/runtime" {
  interface PluginsExtensions {
    prisma: PrismaClient;
  }
}
`,
		);
	},
});
