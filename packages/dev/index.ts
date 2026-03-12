#!/usr/bin/env bun
import { cac } from "cac";
import type { Config } from "../utils/types/config";
import { registerBuildCommand } from "./commands/build";
import { registerDevCommand } from "./commands/dev";
import { registerGenerateConfigTypesCommand } from "./commands/generate-config-types";
import { registerStartCommand } from "./commands/start";
import { registerPluginCommand } from "./commands/plugin";
import { resolve } from "node:path";
import pc from "picocolors";

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
		// @ts-ignore
		const configModule = await import(configPath);
		const config = configModule.default as Config;

		if (config.plugins) {
			for (const pluginInput of config.plugins) {
				let plugin: any;
				if (pluginInput instanceof Promise || (pluginInput && typeof pluginInput === "object" && "then" in pluginInput)) {
					const module = await pluginInput;
					plugin = Object.values(module).find(
						(v: any) => v && typeof v === "object" && "name" in v && "setup" in v
					);
				} else {
					plugin = pluginInput;
				}

				if (plugin?.cli) {
					plugin.cli(cli);
				}
			}
		}
	} catch (_error) {}

	cli.parse(process.argv, { run: false });
	
	if (!cli.matchedCommand && process.argv.length > 2) {
		console.error(pc.red(`\nUnknown command: ${process.argv.slice(2).join(" ")}`));
		console.log(`Run ${pc.bold("djs-core --help")} to see available commands.\n`);
		process.exit(1);
	}

	await cli.runMatchedCommand();
}

run().catch((err) => {
	console.error(pc.red("Fatal error:"), err);
	process.exit(1);
});
