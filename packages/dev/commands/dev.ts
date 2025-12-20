import type { CAC } from "cac";
import { banner, runBot } from "../utils/common";
import { watch } from "fs";
import path from "path";
import fs from "fs/promises";
import pc from "picocolors";
import { Button } from "@djs-core/runtime";
import type { Command } from "@djs-core/runtime";

export function registerDevCommand(cli: CAC) {
	cli
		.command("dev", "Start the bot in development mode")
		.option("-p, --path", "Custom project path", { default: "." })
		.action(async (options) => {
			console.log(banner);
			console.log(pc.cyan("ℹ") + "  Starting development server...");

			const { client, root, fileRouteMap, buttonFileRouteMap } = await runBot(
				options.path,
			);
			const commandsDir = path.join(root, "interactions", "commands");
			const buttonsDir = path.join(root, "interactions", "buttons");

			console.log(
				pc.dim(
					`\nWatching for changes in:\n - ${commandsDir}\n - ${buttonsDir}\n`,
				),
			);
			console.warn(
				pc.yellow(
					"⚠️  Note: File deletions/renames might not be detected automatically on some systems.",
				),
			);

			const commandsWatcher = watch(
				commandsDir,
				{ recursive: true },
				async (event, filename) => {
					if (!filename || !filename.endsWith(".ts")) return;

					const fullPath = path.join(commandsDir, filename);

					const fileExists = await fs
						.stat(fullPath)
						.then(() => true)
						.catch(() => false);

					if (!fileExists) {
						const knownRoute = fileRouteMap.get(fullPath);
						if (knownRoute) {
							console.log(
								pc.red("🗑️  Deleting route:") + ` ${pc.bold(knownRoute)}`,
							);
							await client.commandsHandler.delete(knownRoute);
							fileRouteMap.delete(fullPath);
						} else {
							const relativePath = filename.replace(".ts", "");
							const parts = relativePath.split(path.sep);
							if (parts[parts.length - 1] === "index") parts.pop();
							const probableRoute = parts.join(".");

							console.log(
								pc.red("🗑️  Deleting route:") +
									` ${pc.bold(probableRoute)} ` +
									pc.dim("(not in map)"),
							);
							await client.commandsHandler.delete(probableRoute);
						}
						return;
					}

					const relativePath = filename.replace(".ts", "");
					const parts = relativePath.split(path.sep);
					if (parts[parts.length - 1] === "index") {
						parts.pop();
					}
					const route = parts.join(".");

					console.log(pc.blue("📝 File changed:") + ` ${filename}`);

					try {
						const commandModule = await import(`${fullPath}?t=${Date.now()}`);
						const command = commandModule.default as Command;

						if (!command) {
							console.warn(
								pc.yellow("⚠️  No default export found in ") + filename,
							);
							return;
						}

						if (filename.endsWith("index.ts")) {
							command.setName(parts[parts.length - 1] || "index");
						} else {
							command.setName(parts[parts.length - 1]!);
						}

						console.log(pc.green("✨ Reloading route:") + ` ${pc.bold(route)}`);
						await client.commandsHandler.add({ route, command });

						fileRouteMap.set(fullPath, route);
					} catch (error) {
						console.error(pc.red(`❌ Error reloading ${filename}:`), error);
					}
				},
			);

			const buttonsWatcher = watch(
				buttonsDir,
				{ recursive: true },
				async (event, filename) => {
					if (!filename || !filename.endsWith(".ts")) return;

					const fullPath = path.join(buttonsDir, filename);
					const fileExists = await fs
						.stat(fullPath)
						.then(() => true)
						.catch(() => false);

					const relativePath = filename.replace(".ts", "");
					const parts = relativePath.split(path.sep);
					if (parts[parts.length - 1] === "index") parts.pop();
					const route = parts.join(".");

					if (!fileExists) {
						const knownRoute = buttonFileRouteMap.get(fullPath) ?? route;
						console.log(
							pc.red("🗑️  Deleting button:") + ` ${pc.bold(knownRoute)}`,
						);
						client.buttonsHandler.delete(knownRoute);
						buttonFileRouteMap.delete(fullPath);
						return;
					}

					console.log(pc.magenta("🧩 Button file changed:") + ` ${filename}`);

					try {
						const mod = await import(`${fullPath}?t=${Date.now()}`);
						const button = mod.default as Button;
						if (!button) {
							console.warn(
								pc.yellow("⚠️  No default export found in ") + filename,
							);
							return;
						}

						// Ensure customId matches the route derived from the file path
						button.setCustomId(route);

						console.log(
							pc.green("✨ Reloading button:") + ` ${pc.bold(route)}`,
						);
						client.buttonsHandler.add(button);
						buttonFileRouteMap.set(fullPath, route);
					} catch (error) {
						console.error(
							pc.red(`❌ Error reloading button ${filename}:`),
							error,
						);
					}
				},
			);

			process.on("SIGINT", () => {
				commandsWatcher.close();
				buttonsWatcher.close();
				process.exit(0);
			});
		});
}
