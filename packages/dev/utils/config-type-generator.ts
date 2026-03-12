import { existsSync } from "node:fs";
import fs from "fs/promises";
import path from "path";
import pc from "picocolors";

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
			console.warn(
				pc.yellow("⚠️  Could not write .djscore/discord.d.ts"),
				error instanceof Error ? error.message : error,
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
		tsconfig.include = include;
		await fs.writeFile(
			tsconfigPath,
			JSON.stringify(tsconfig, null, 2),
			"utf-8",
		);
		if (!silent) {
			console.log(
				pc.green("✓  tsconfig.json include updated for .djscore types"),
			);
		}
	} catch {
		// tsconfig not found or invalid: skip, no need to warn every time
	}
}

import type { Config } from "../../utils/types/config";

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
		// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin loading
		let plugin: any;
		if (
			pluginInput instanceof Promise ||
			(pluginInput && typeof pluginInput === "object" && "then" in pluginInput)
		) {
			const module = await pluginInput;
			plugin = Object.values(module).find(
				// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin loading
				(v: any) => v && typeof v === "object" && "name" in v && "setup" in v,
			);
		} else {
			plugin = pluginInput;
		}

		if (plugin?.types) {
			const pluginTypes = await plugin.types({ root: projectRoot });
			types.push(`// --- ${plugin.name} ---\n${pluginTypes}`);
		}
	}

	if (types.length > 0) {
		await fs.mkdir(djscoreDir, { recursive: true });
		await fs.writeFile(
			pluginsDtsPath,
			`// Auto-generated. Do not edit manually.\n\n${types.join("\n\n")}\n`,
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

	// Always generate plugin types
	await generatePluginTypes(projectRoot, config);

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
			console.log(pc.green("✓  Config types auto-generated"));
		}
		return true;
	} catch (error: unknown) {
		if (!silent) {
			console.warn(
				pc.yellow(`⚠️  Error generating config types from ${configJsonPath}`),
			);
			console.warn(
				pc.dim("   Possible causes: invalid JSON syntax, file permissions"),
			);
			if (error instanceof Error) {
				console.warn(pc.dim(`   ${error.message}`));
			}
		}
		return false;
	}
}
