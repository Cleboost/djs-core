import type { CAC } from "cac";
import fs from "fs/promises";
import path from "path";
import pc from "picocolors";
import { banner } from "../utils/common";
import { generateTypesFromJson } from "../utils/config-type-generator";

export function registerGenerateConfigTypesCommand(cli: CAC) {
	cli
		.command("generate-config-types", "Generate TypeScript types from config.json")
		.option("-p, --path <path>", "Custom project path", { default: "." })
		.action(async (options: { path: string }) => {
			console.log(banner);
			console.log(`${pc.cyan("ℹ")}  Generating config types...`);

			const projectRoot = path.resolve(process.cwd(), options.path);
			const configJsonPath = path.join(projectRoot, "config.json");
			const outputPath = path.join(projectRoot, "config.types.ts");

			try {
				await fs.access(configJsonPath);
			} catch {
				console.error(
					pc.red(
						`❌ config.json not found at ${configJsonPath}\n   Create a config.json file first.`,
					),
				);
				process.exit(1);
			}

			try {
				await generateTypesFromJson(configJsonPath, outputPath);
				console.log(
					pc.green(`✓  Types generated successfully at ${outputPath}`),
				);
			} catch (error: unknown) {
				console.error(pc.red("❌ Error generating types:"), error);
				process.exit(1);
			}
		});
}
