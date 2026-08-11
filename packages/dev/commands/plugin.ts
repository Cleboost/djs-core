import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import { resolve } from "node:path";
import { devLog } from "@djs-core/runtime";
import type { CAC } from "cac";
import pc from "picocolors";
import { banner } from "../utils/common";

async function runPostinstall(fullName: string, projectRoot: string) {
	try {
		let mainEntry = "";
		try {
			const pluginPkgPath = resolve(
				projectRoot,
				"node_modules",
				fullName,
				"package.json",
			);
			const stats = await fs.stat(pluginPkgPath).catch(() => null);
			if (stats) {
				const pkg = JSON.parse(await fs.readFile(pluginPkgPath, "utf-8"));
				mainEntry = resolve(
					projectRoot,
					"node_modules",
					fullName,
					pkg.main || "dist/index.js",
				);
			} else {
				const rootPluginPkgPath = resolve(
					projectRoot,
					"..",
					"..",
					"node_modules",
					fullName,
					"package.json",
				);
				const pkg = JSON.parse(await fs.readFile(rootPluginPkgPath, "utf-8"));
				mainEntry = resolve(
					projectRoot,
					"..",
					"..",
					"node_modules",
					fullName,
					pkg.main || "dist/index.js",
				);
			}
		} catch {
			const localPluginPkgPath = resolve(
				projectRoot,
				"..",
				"..",
				"plugins",
				fullName.replace("@djs-core/", ""),
				"package.json",
			);
			const pkg = JSON.parse(await fs.readFile(localPluginPkgPath, "utf-8"));
			mainEntry = resolve(
				projectRoot,
				"..",
				"..",
				"plugins",
				fullName.replace("@djs-core/", ""),
				pkg.main || "dist/index.js",
			);
		}

		if (mainEntry) {
			const module = await import(mainEntry);
			const pluginObj = Object.values(module).find(
				// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin loading
				(v: any) => v && typeof v === "object" && "name" in v && "setup" in v,
				// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin loading
			) as any;

			if (pluginObj?.postinstall) {
				devLog.info(`Running postinstall for ${pc.bold(fullName)}...`);
				await pluginObj.postinstall({ root: projectRoot });
				devLog.success("Postinstall completed!");
				return true;
			}
		}
	} catch (error) {
		if (process.env.DEBUG) {
			devLog.debug(`Postinstall failed: ${String(error)}`);
		}
	}
	return false;
}

export function registerPluginCommand(cli: CAC) {
	cli
		.command(
			"plugin <action> <name>",
			"Manage bot plugins (install, postinstall)",
		)
		.action(async (action: string, name: string) => {
			const fullName = name.startsWith("@") ? name : `@djs-core/${name}`;
			const projectRoot = process.cwd();

			if (action === "postinstall") {
				devLog.raw(banner);
				const success = await runPostinstall(fullName, projectRoot);
				if (!success) {
					devLog.warn(`No postinstall hook found or failed for ${fullName}`);
				}
				process.exit(0);
			}

			if (action !== "install") {
				devLog.error(`Unknown plugin action: ${action}`);
				devLog.info(`Available actions: ${pc.bold("install, postinstall")}`);
				process.exit(1);
			}

			devLog.raw(banner);
			devLog.info(`Installing plugin: ${pc.bold(fullName)}...`);

			const result = spawnSync("bun", ["add", fullName], {
				stdio: "inherit",
			});

			if (result.status !== 0) {
				devLog.error(`Failed to install plugin: ${fullName}`);
				process.exit(1);
			}

			devLog.success(`Plugin ${pc.bold(fullName)} installed successfully!`);

			const configPath = resolve(projectRoot, "djs.config.ts");

			try {
				if (await fs.stat(configPath).catch(() => null)) {
					let configContent = await fs.readFile(configPath, "utf-8");

					if (!configContent.includes(fullName)) {
						devLog.info(
							`Adding ${pc.bold(fullName)} to ${pc.white("djs.config.ts")}...`,
						);

						const importSnippet = `import("${fullName}")`;

						if (configContent.includes("plugins: [")) {
							configContent = configContent.replace(
								"plugins: [",
								`plugins: [\n\t\t${importSnippet},`,
							);
						} else {
							configContent = configContent.replace(
								"defineConfig({",
								`defineConfig({\n\tplugins: [${importSnippet}],`,
							);
						}

						const configKey =
							fullName.split("/").pop()?.replace("plugin-", "") || "";
						if (configKey && !configContent.includes(`${configKey}:`)) {
							if (configContent.includes("pluginsConfig: {")) {
								configContent = configContent.replace(
									"pluginsConfig: {",
									`pluginsConfig: {\n\t\t${configKey}: {},`,
								);
							} else {
								configContent = configContent.replace(
									"defineConfig({",
									`defineConfig({\n\tpluginsConfig: {\n\t\t${configKey}: {},\n\t},`,
								);
							}
						}

						await fs.writeFile(configPath, configContent, "utf-8");
						devLog.success("Config updated!");
					}
				}
			} catch (error) {
				devLog.warn(
					`Could not update djs.config.ts: ${(error as Error).message}`,
				);
			}

			await runPostinstall(fullName, projectRoot);

			devLog.info("Next steps:");
			devLog.info(
				pc.dim(
					`Configure the plugin in ${pc.white("pluginsConfig")} if needed (in djs.config.ts)`,
				),
			);

			process.exit(0);
		});
}
