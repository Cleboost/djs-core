#!/usr/bin/env bun
import { resolve } from "node:path";
import { cac } from "cac";
import pc from "picocolors";
import type { Config } from "../utils/types/config";
import { registerBuildCommand } from "./commands/build";
import { registerDevCommand } from "./commands/dev";
import { registerGenerateConfigTypesCommand } from "./commands/generate-config-types";
import { registerPluginCommand } from "./commands/plugin";
import { registerStartCommand } from "./commands/start";
import { resolvePlugin } from "./utils/plugin";

export type { Config };

async function run() {
	const cli = cac("djs-core").version("5.1.0").help();

	registerStartCommand(cli);
	registerDevCommand(cli);
	registerBuildCommand(cli);
	registerGenerateConfigTypesCommand(cli);
	registerPluginCommand(cli);

	try {
		const configPath = resolve(process.cwd(), "djs.config.ts");
		const configModule = await import(configPath);
		const config = configModule.default as Config;

		if (config.plugins) {
			for (const pluginInput of config.plugins) {
				const plugin = await resolvePlugin(pluginInput);
				if (plugin?.cli) {
					plugin.cli(cli);
				}
			}
		}
	} catch (error) {
		if (process.env.DEBUG) {
			console.error(
				pc.dim("[DEBUG] Failed to load djs.config.ts or plugin CLI commands:"),
				error,
			);
		}
	}

	try {
		cli.parse();
	} catch (err) {
		console.error(pc.red("Error:"), (err as Error).message);
		process.exit(1);
	}
}

run().catch((err) => {
	console.error(pc.red("Fatal error:"), err);
	process.exit(1);
});
