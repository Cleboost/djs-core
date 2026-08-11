import { type Config, devLog } from "@djs-core/runtime";
import type { CAC } from "cac";
import fs from "fs/promises";
import path from "path";
import { banner } from "../utils/common";
import { autoGenerateConfigTypes } from "../utils/config-type-generator";

export function registerGenerateConfigTypesCommand(cli: CAC) {
	cli
		.command(
			"generate-config-types",
			"Generate TypeScript types from config.json",
		)
		.option("-p, --path <path>", "Custom project path", { default: "." })
		.action(async (options: { path: string }) => {
			devLog.raw(banner);
			devLog.info("Generating config types...");

			const projectRoot = path.resolve(process.cwd(), options.path);
			const configJsonPath = path.join(projectRoot, "config.json");
			const outputPath = path.join(projectRoot, ".djscore", "config.types.ts");

			// Load config to pass to autoGenerateConfigTypes
			let config: Config;
			try {
				const configModule = await import(
					path.join(projectRoot, "djs.config.ts")
				);
				config = configModule.default as Config;
			} catch (error) {
				devLog.error(`djs.config.ts not found at ${projectRoot}`, error);
				process.exit(1);
			}

			try {
				await fs.mkdir(path.dirname(outputPath), { recursive: true });
				await fs.access(configJsonPath);
			} catch {
				// config.json not found, but we still want plugin types
				await autoGenerateConfigTypes(projectRoot, config, false);
				devLog.success("Plugin types generated");
				return;
			}

			try {
				await autoGenerateConfigTypes(projectRoot, config, false);
				devLog.success(`Types generated successfully at ${outputPath}`);
			} catch (error: unknown) {
				devLog.error("Error generating types", error);
				process.exit(1);
			}
		});
}
