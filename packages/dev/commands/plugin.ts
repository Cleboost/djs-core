import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import { resolve } from "node:path";
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
				console.log(
					`${pc.cyan("ℹ")} Running postinstall for ${pc.bold(fullName)}...`,
				);
				await pluginObj.postinstall({ root: projectRoot });
				console.log(pc.green("✓ Postinstall completed!"));
				return true;
			}
		}
	} catch (_error) {}
	return false;
}

export function registerPluginCommand(cli: CAC) {
	cli
		.command(
			"plugin <action> <name>",
			"Manage bot plugins (install, postinstall)",
		)
		.action(async (action: string, name: string) => {
			if (!name || !/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)) {
				console.error(pc.red(`\n❌ Invalid plugin name: ${name}`));
				process.exit(1);
			}

			const fullName = name.startsWith("@") ? name : `@djs-core/${name}`;
			const projectRoot = process.cwd();

			if (action === "postinstall") {
				console.log(banner);
				const success = await runPostinstall(fullName, projectRoot);
				if (!success) {
					console.log(
						pc.yellow(`⚠️  No postinstall hook found or failed for ${fullName}`),
					);
				}
				process.exit(0);
			}

			if (action !== "install") {
				console.error(pc.red(`\nUnknown plugin action: ${action}`));
				console.log(`Available actions: ${pc.bold("install, postinstall")}\n`);
				process.exit(1);
			}

			console.log(banner);
			console.log(
				`${pc.cyan("ℹ")} Installing plugin: ${pc.bold(fullName)}...\n`,
			);

			const result = spawnSync("bun", ["add", fullName], {
				stdio: "inherit",
			});

			if (result.status !== 0) {
				console.error(pc.red(`\n❌ Failed to install plugin: ${fullName}`));
				process.exit(1);
			}

			console.log(
				pc.green(`\n✓ Plugin ${pc.bold(fullName)} installed successfully!`),
			);

			const configPath = resolve(projectRoot, "djs.config.ts");

			try {
				if (await fs.stat(configPath).catch(() => null)) {
					let configContent = await fs.readFile(configPath, "utf-8");

					if (!configContent.includes(fullName)) {
						console.log(
							`${pc.cyan("ℹ")} Adding ${pc.bold(fullName)} to ${pc.white("djs.config.ts")}...`,
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
						console.log(pc.green("✓ Config updated!\n"));
					}
				}
			} catch (error) {
				console.warn(
					pc.yellow(
						`⚠️  Could not update djs.config.ts: ${(error as Error).message}`,
					),
				);
			}

			await runPostinstall(fullName, projectRoot);

			console.log(pc.dim("\nNext steps:"));
			console.log(
				pc.dim(
					`1. Configure the plugin in ${pc.white("pluginsConfig")} if needed (in djs.config.ts)\n`,
				),
			);

			process.exit(0);
		});
}
