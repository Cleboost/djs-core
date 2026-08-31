#!/usr/bin/env bun
import { resolve } from "node:path";
import { type Config, devLog } from "@djs-core/runtime";
import { cac } from "cac";
import { registerBuildCommand } from "./commands/build";
import { registerCheckCommand } from "./commands/check";
import { registerDbCommand } from "./commands/db";
import { registerDevCommand } from "./commands/dev";
import { registerGenerateCommand } from "./commands/generate";
import { registerGenerateConfigTypesCommand } from "./commands/generate-config-types";
import { registerListCommand } from "./commands/list";
import { registerPluginCommand } from "./commands/plugin";
import { registerStartCommand } from "./commands/start";
import { registerTestCommand } from "./commands/test";
import { resolvePlugin } from "./utils/plugin";
import { CLI_VERSION } from "./version";

export type { Config };
export { CLI_VERSION };

async function run() {
	const cli = cac("djs-core").version(CLI_VERSION).help();

	registerStartCommand(cli);
	registerDevCommand(cli);
	registerBuildCommand(cli);
	registerListCommand(cli);
	registerCheckCommand(cli);
	registerGenerateCommand(cli);
	registerGenerateConfigTypesCommand(cli);
	registerPluginCommand(cli);
	registerDbCommand(cli);
	registerTestCommand(cli);

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
			devLog.debug(
				`Failed to load djs.config.ts or plugin CLI commands: ${String(error)}`,
			);
		}
	}

	try {
		cli.parse();
	} catch (err) {
		devLog.error(`Error: ${(err as Error).message}`);
		process.exit(1);
	}
}

run().catch((err) => {
	devLog.error("Fatal error", err);
	process.exit(1);
});
