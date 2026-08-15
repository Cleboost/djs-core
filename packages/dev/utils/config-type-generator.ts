import { existsSync } from "node:fs";
import { writeDrizzleKitConfig } from "@djs-core/db";
import type { Config, DbDialect } from "@djs-core/runtime";
import { devLog } from "@djs-core/runtime";
import fs from "fs/promises";
import path from "path";
import pc from "picocolors";
import { resolvePlugin } from "./plugin";

function inferType(value: unknown): string {
	if (value === null) return "null";
	if (value === undefined) return "undefined";
	if (typeof value === "string") return "string";
	if (typeof value === "number") return "number";
	if (typeof value === "boolean") return "boolean";

	if (Array.isArray(value)) {
		if (value.length === 0) return "unknown[]";
		const firstElement = value[0];
		const elementType = inferType(firstElement);
		const allSameType = value.every((v) => inferType(v) === elementType);
		return allSameType ? `${elementType}[]` : "unknown[]";
	}

	if (typeof value === "object") {
		const entries = Object.entries(value);
		if (entries.length === 0) return "Record<string, unknown>";

		const properties = entries
			.map(([key, val]) => {
				const valueType = inferType(val);
				return `${key}: ${valueType}`;
			})
			.join("; ");

		return `{ ${properties} }`;
	}

	return "unknown";
}

function generateTypeDefinition(
	obj: unknown,
	typeName: string,
	indent = 0,
): string {
	if (obj === null) return "null";
	if (obj === undefined) return "undefined";

	const indentStr = "  ".repeat(indent);
	const nextIndentStr = "  ".repeat(indent + 1);

	if (Array.isArray(obj)) {
		if (obj.length === 0) return "unknown[]";
		const firstElement = obj[0];
		const elementType = inferType(firstElement);
		return `${elementType}[]`;
	}

	if (typeof obj === "object") {
		const entries = Object.entries(obj);
		if (entries.length === 0) return "Record<string, unknown>";

		const properties = entries
			.map(([key, value]) => {
				const valueType = inferType(value);
				return `${nextIndentStr}${key}: ${valueType};`;
			})
			.join("\n");

		return `${indent === 0 ? "" : "\n"}${indentStr}interface ${typeName} {\n${properties}\n${indentStr}}`;
	}

	return inferType(obj);
}

async function generateTypesFromJson(
	configJsonPath: string,
	outputPath: string,
): Promise<void> {
	const jsonContent = await fs.readFile(configJsonPath, "utf-8");
	const config = JSON.parse(jsonContent);

	const typeDefinition = generateTypeDefinition(config, "UserConfig");

	const fileContent = `// Auto-generated from config.json. Do not edit manually.

${typeDefinition}

export type { UserConfig };
`;

	await fs.writeFile(outputPath, fileContent, "utf-8");
}

const DISCORD_D_TS_CONTENT = `import type { UserConfig } from "./config.types";
import type { PluginsExtensions } from "@djs-core/runtime";

declare module "discord.js" {
	interface Client extends PluginsExtensions {
		config?: UserConfig;
	}
}
`;

const TSCONFIG_INCLUDE_ENTRY = ".djscore/**/*.d.ts";
const TSCONFIG_INCLUDE_ROOT_DTS = ".djscore/*.d.ts";
const TSCONFIG_DB_ENTRY = "./.djscore/db.ts";
const DB_PATH_ALIAS = "@djs-core/db";
const DB_PATH_TARGET = "./.djscore/db.ts";

const DB_ENTRY_TS_CONTENT = `// Auto-generated. Do not edit manually.

export * as schema from "../db/schema";
export {
	and,
	asc,
	avg,
	between,
	count,
	desc,
	eq,
	gt,
	gte,
	ilike,
	inArray,
	isNotNull,
	isNull,
	like,
	lt,
	lte,
	max,
	min,
	ne,
	not,
	notInArray,
	or,
	sql,
	sum,
} from "drizzle-orm";
`;

async function ensureDbTsconfigPaths(
	projectRoot: string,
	enabled: boolean,
	silent = false,
): Promise<void> {
	const tsconfigPath = path.join(projectRoot, "tsconfig.json");

	try {
		const raw = await fs.readFile(tsconfigPath, "utf-8");
		const tsconfig = JSON.parse(raw) as {
			include?: string[];
			compilerOptions?: { paths?: Record<string, string[]> };
		};

		if (!tsconfig.compilerOptions) {
			tsconfig.compilerOptions = {};
		}
		const paths = tsconfig.compilerOptions.paths ?? {};
		const include = Array.isArray(tsconfig.include) ? tsconfig.include : [];

		if (enabled) {
			paths[DB_PATH_ALIAS] = [DB_PATH_TARGET];
			if (!include.includes(TSCONFIG_DB_ENTRY)) {
				include.push(TSCONFIG_DB_ENTRY);
			}
		} else {
			delete paths[DB_PATH_ALIAS];
			const dbEntryIndex = include.indexOf(TSCONFIG_DB_ENTRY);
			if (dbEntryIndex !== -1) {
				include.splice(dbEntryIndex, 1);
			}
		}

		tsconfig.compilerOptions.paths = paths;
		if (tsconfig.include || include.length > 0) {
			tsconfig.include = include;
		}

		await fs.writeFile(
			tsconfigPath,
			JSON.stringify(tsconfig, null, 2),
			"utf-8",
		);
		if (!silent && enabled) {
			devLog.success("tsconfig.json paths updated for @djs-core/db");
		}
	} catch {
		// tsconfig not found or invalid: skip
	}
}

/**
 * Creates .djscore/discord.d.ts and ensures tsconfig.json include contains the .djscore types entry.
 */
async function ensureDiscordAugmentation(
	projectRoot: string,
	silent = false,
): Promise<void> {
	const djscoreDir = path.join(projectRoot, ".djscore");
	const discordDtsPath = path.join(djscoreDir, "discord.d.ts");
	const tsconfigPath = path.join(projectRoot, "tsconfig.json");

	try {
		await fs.mkdir(djscoreDir, { recursive: true });
		await fs.writeFile(
			discordDtsPath,
			DISCORD_D_TS_CONTENT.trimStart(),
			"utf-8",
		);
	} catch (error: unknown) {
		if (!silent) {
			devLog.warn(
				`Could not write .djscore/discord.d.ts — ${error instanceof Error ? error.message : String(error)}`,
			);
		}
		return;
	}

	try {
		const raw = await fs.readFile(tsconfigPath, "utf-8");
		const tsconfig = JSON.parse(raw) as { include?: string[] };
		const include = tsconfig.include;
		if (!Array.isArray(include)) {
			return;
		}
		if (include.includes(TSCONFIG_INCLUDE_ENTRY)) {
			return;
		}
		include.push(TSCONFIG_INCLUDE_ENTRY);
		if (!include.includes(TSCONFIG_INCLUDE_ROOT_DTS)) {
			include.push(TSCONFIG_INCLUDE_ROOT_DTS);
		}
		tsconfig.include = include;
		await fs.writeFile(
			tsconfigPath,
			JSON.stringify(tsconfig, null, 2),
			"utf-8",
		);
		if (!silent) {
			devLog.success("tsconfig.json include updated for .djscore types");
		}
	} catch {
		// tsconfig not found or invalid: skip, no need to warn every time
	}
}

/**
 * Generates .djscore/db.d.ts for native client.db typing.
 */
async function generateDbTypes(
	projectRoot: string,
	config: Config,
	silent = false,
): Promise<void> {
	const djscoreDir = path.join(projectRoot, ".djscore");
	const dbClientDtsPath = path.join(djscoreDir, "db.client.d.ts");
	const dbEntryPath = path.join(djscoreDir, "db.ts");

	if (!config.db) {
		if (existsSync(dbClientDtsPath)) {
			await fs.unlink(dbClientDtsPath).catch(() => {});
		}
		if (existsSync(dbEntryPath)) {
			await fs.unlink(dbEntryPath).catch(() => {});
		}
		await ensureDbTsconfigPaths(projectRoot, false, silent);
		return;
	}

	const dialect = config.db.dialect ?? "sqlite";

	const dialectTypeMap: Record<DbDialect, string> = {
		sqlite: `import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schema from "../db/schema";
import type {} from "@djs-core/runtime";

declare module "discord.js" {
  interface Client {
    db: BunSQLiteDatabase<typeof schema>;
  }
}

declare module "@djs-core/runtime" {
  interface DjsClient {
    db: BunSQLiteDatabase<typeof schema>;
  }
}
`,
		postgresql: `import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../db/schema";
import type {} from "@djs-core/runtime";

declare module "discord.js" {
  interface Client {
    db: NodePgDatabase<typeof schema>;
  }
}

declare module "@djs-core/runtime" {
  interface DjsClient {
    db: NodePgDatabase<typeof schema>;
  }
}
`,
		mysql: `import type { MySql2Database } from "drizzle-orm/mysql2";
import type * as schema from "../db/schema";
import type {} from "@djs-core/runtime";

declare module "discord.js" {
  interface Client {
    db: MySql2Database<typeof schema>;
  }
}

declare module "@djs-core/runtime" {
  interface DjsClient {
    db: MySql2Database<typeof schema>;
  }
}
`,
		turso: `import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "../db/schema";
import type {} from "@djs-core/runtime";

declare module "discord.js" {
  interface Client {
    db: LibSQLDatabase<typeof schema>;
  }
}

declare module "@djs-core/runtime" {
  interface DjsClient {
    db: LibSQLDatabase<typeof schema>;
  }
}
`,
	};

	await fs.mkdir(djscoreDir, { recursive: true });
	await fs.writeFile(
		dbClientDtsPath,
		`// Auto-generated. Do not edit manually.\n\n${dialectTypeMap[dialect]}`,
		"utf-8",
	);
	await fs.writeFile(dbEntryPath, DB_ENTRY_TS_CONTENT, "utf-8");
	writeDrizzleKitConfig(projectRoot, config.db);
	await ensureDbTsconfigPaths(projectRoot, true, silent);
}

/**
 * Collects and writes types provided by plugins.
 */
async function generatePluginTypes(
	projectRoot: string,
	config: Config,
): Promise<void> {
	const djscoreDir = path.join(projectRoot, ".djscore");
	const pluginsDtsPath = path.join(djscoreDir, "plugins.d.ts");

	if (!config.plugins || config.plugins.length === 0) {
		if (existsSync(pluginsDtsPath)) {
			await fs.unlink(pluginsDtsPath).catch(() => {});
		}
		return;
	}

	const types: string[] = [];

	for (const pluginInput of config.plugins) {
		const plugin = await resolvePlugin(pluginInput, projectRoot);

		if (plugin?.types) {
			const pluginTypes = await plugin.types({ root: projectRoot });
			types.push(`// --- ${plugin.name} ---\n${pluginTypes}`);
		}
	}

	if (types.length > 0) {
		await fs.mkdir(djscoreDir, { recursive: true });
		await fs.writeFile(
			pluginsDtsPath,
			`// Auto-generated. Do not edit manually.\n\nimport type {} from "@djs-core/runtime";\n\n${types.join("\n\n")}\n`,
			"utf-8",
		);
	} else if (existsSync(pluginsDtsPath)) {
		await fs.unlink(pluginsDtsPath).catch(() => {});
	}
}

/**
 * Auto-generate config types if userConfig is enabled and config.json exists
 * This is called automatically by dev/build/start commands
 */
export async function autoGenerateConfigTypes(
	projectRoot: string,
	config: Config,
	silent = false,
): Promise<boolean> {
	const configJsonPath = path.join(projectRoot, "config.json");
	const outputPath = path.join(projectRoot, ".djscore", "config.types.ts");

	// Always generate plugin types and native db types
	await generatePluginTypes(projectRoot, config);
	await generateDbTypes(projectRoot, config);

	try {
		await fs.access(configJsonPath);
	} catch {
		// config.json doesn't exist, skip generation but ensure discord types are there
		await ensureDiscordAugmentation(projectRoot, true);

		// create empty config.types.ts if it doesn't exist
		if (!existsSync(outputPath)) {
			await fs.mkdir(path.dirname(outputPath), { recursive: true });
			await fs.writeFile(
				outputPath,
				"// Auto-generated. config.json not found.\nexport interface UserConfig {}\n",
				"utf-8",
			);
		}
		return false;
	}

	try {
		await fs.mkdir(path.dirname(outputPath), { recursive: true });
		await generateTypesFromJson(configJsonPath, outputPath);
		await ensureDiscordAugmentation(projectRoot, silent);
		if (!silent) {
			devLog.success("Config types auto-generated");
		}
		return true;
	} catch (error: unknown) {
		if (!silent) {
			devLog.warn(`Error generating config types from ${configJsonPath}`);
			devLog.warn(
				pc.dim("Possible causes: invalid JSON syntax, file permissions"),
			);
			if (error instanceof Error) {
				devLog.warn(pc.dim(error.message));
			}
		}
		return false;
	}
}
