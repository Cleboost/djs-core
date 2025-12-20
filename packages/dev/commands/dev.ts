import type { CAC } from "cac";
import { banner, runBot } from "../utils/common";
import chokidar from "chokidar";
import path from "path";
import pc from "picocolors";
import type { Button } from "@djs-core/runtime";
import type { Command } from "@djs-core/runtime";
import type { EventLister } from "@djs-core/runtime";

export function registerDevCommand(cli: CAC) {
	cli
		.command("dev", "Start the bot in development mode")
		.option("-p, --path", "Custom project path", { default: "." })
		.action(async (options) => {
			console.log(banner);
			console.log(`${pc.cyan("ℹ")}  Starting development server...`);

			const { client, root, fileRouteMap, buttonFileRouteMap, eventFileIdMap } =
				await runBot(options.path);
			const commandsDir = path.join(root, "interactions", "commands");
			const buttonsDir = path.join(root, "interactions", "buttons");
			const eventsDir = path.join(root, "interactions", "events");

			console.log(
				pc.dim(
					`\nWatching for changes in:\n - ${commandsDir}\n - ${buttonsDir}\n - ${eventsDir}\n`,
				),
			);

			const sleep = (ms: number) =>
				new Promise<void>((resolve) => {
					setTimeout(resolve, ms);
				});

			function routeFromWatchedFile(
				rootDir: string,
				absPath: string,
			): string | null {
				const rel = path.relative(rootDir, absPath);
				if (!rel || rel.startsWith("..")) return null;
				if (!rel.endsWith(".ts")) return null;
				const parts = rel.replace(/\.ts$/, "").split(path.sep);
				if (parts[parts.length - 1] === "index") parts.pop();
				if (parts.length === 0) return "index";
				return parts.join(".");
			}

			async function reloadCommand(
				absPath: string,
				opts?: { retries?: number },
			): Promise<void> {
				const route = routeFromWatchedFile(commandsDir, absPath);
				if (!route) return;

				const retries = opts?.retries ?? 0;

				try {
					const mod = await import(
						`${absPath}?t=${Date.now()}&r=${Math.random()}`
					);
					const command = mod.default as Command | undefined;
					if (!command) {
						if (retries > 0) {
							await sleep(150);
							return await reloadCommand(absPath, {
								retries: retries - 1,
							});
						}
						return;
					}

					const parts = route.split(".");
					const leaf = parts[parts.length - 1];
					if (leaf) command.setName(leaf);

					const existingRoute = fileRouteMap.get(absPath);
					if (existingRoute && existingRoute !== route) {
						await client.commandsHandler.delete(existingRoute);
					}
					console.log(`${pc.green("✨ Reloading route:")} ${pc.bold(route)}`);
					await client.commandsHandler.add({ route, command });
					fileRouteMap.set(absPath, route);
				} catch (error) {
					if (retries > 0) {
						await sleep(150);
						return await reloadCommand(absPath, {
							retries: retries - 1,
						});
					}
					console.error(
						pc.red(`❌ Error reloading command ${absPath}:`),
						error,
					);
				}
			}

			async function deleteCommand(absPath: string): Promise<void> {
				const knownRoute =
					fileRouteMap.get(absPath) ??
					routeFromWatchedFile(commandsDir, absPath);
				if (!knownRoute) return;
				console.log(`${pc.red("🗑️  Deleting route:")} ${pc.bold(knownRoute)}`);
				await client.commandsHandler.delete(knownRoute);
				fileRouteMap.delete(absPath);
			}

			async function reloadButton(
				absPath: string,
				opts?: { retries?: number },
			): Promise<void> {
				const route = routeFromWatchedFile(buttonsDir, absPath);
				if (!route) return;

				const retries = opts?.retries ?? 0;

				try {
					const mod = await import(
						`${absPath}?t=${Date.now()}&r=${Math.random()}`
					);
					const button = mod.default as Button | undefined;
					if (!button) {
						if (retries > 0) {
							await sleep(150);
							return await reloadButton(absPath, {
								retries: retries - 1,
							});
						}
						return;
					}

					button.setCustomId(route);
					const existingRoute = buttonFileRouteMap.get(absPath);
					if (existingRoute && existingRoute !== route) {
						client.buttonsHandler.delete(existingRoute);
					}
					console.log(`${pc.green("✨ Reloading button:")} ${pc.bold(route)}`);
					client.buttonsHandler.add(button);
					buttonFileRouteMap.set(absPath, route);
				} catch (error) {
					if (retries > 0) {
						await sleep(150);
						return await reloadButton(absPath, {
							retries: retries - 1,
						});
					}
					console.error(pc.red(`❌ Error reloading button ${absPath}:`), error);
				}
			}

			function deleteButton(absPath: string): void {
				const knownRoute =
					buttonFileRouteMap.get(absPath) ??
					routeFromWatchedFile(buttonsDir, absPath);
				if (!knownRoute) return;
				console.log(`${pc.red("🗑️  Deleting button:")} ${pc.bold(knownRoute)}`);
				client.buttonsHandler.delete(knownRoute);
				buttonFileRouteMap.delete(absPath);
			}

			function eventIdFromFile(absPath: string): string | null {
				if (!absPath.endsWith(".ts")) return null;
				const fileName = path.basename(absPath, ".ts");
				return fileName;
			}

			async function reloadEvent(
				absPath: string,
				opts?: { retries?: number },
			): Promise<void> {
				const eventId = eventIdFromFile(absPath);
				if (!eventId) return;

				const retries = opts?.retries ?? 0;

				try {
					const mod = await import(
						`${absPath}?t=${Date.now()}&r=${Math.random()}`
					);
					const event = mod.default as EventLister | undefined;
					if (!event) {
						if (retries > 0) {
							await sleep(150);
							return await reloadEvent(absPath, {
								retries: retries - 1,
							});
						}
						return;
					}

					const existingId = eventFileIdMap.get(absPath);
					if (existingId && existingId !== eventId) {
						client.eventsHandler.remove(existingId);
					}
					console.log(`${pc.green("✨ Reloading event:")} ${pc.bold(eventId)}`);
					client.eventsHandler.remove(eventId);
					client.eventsHandler.add(eventId, event);
					eventFileIdMap.set(absPath, eventId);
				} catch (error) {
					if (retries > 0) {
						await sleep(150);
						return await reloadEvent(absPath, {
							retries: retries - 1,
						});
					}
					console.error(pc.red(`❌ Error reloading event ${absPath}:`), error);
				}
			}

			function deleteEvent(absPath: string): void {
				const knownId = eventFileIdMap.get(absPath) ?? eventIdFromFile(absPath);
				if (!knownId) return;
				console.log(`${pc.red("🗑️  Deleting event:")} ${pc.bold(knownId)}`);
				client.eventsHandler.remove(knownId);
				eventFileIdMap.delete(absPath);
			}

			const watcher = chokidar.watch([commandsDir, buttonsDir, eventsDir], {
				ignoreInitial: true,
				ignored: /(^|[/\\])\../,
				usePolling: true,
				interval: 300,
				binaryInterval: 300,
			});

			watcher
				.on("add", async (absPath) => {
					if (!absPath.endsWith(".ts")) return;
					if (absPath.startsWith(commandsDir)) {
						await reloadCommand(absPath, { retries: 5 });
					} else if (absPath.startsWith(buttonsDir)) {
						await reloadButton(absPath, { retries: 5 });
					} else if (absPath.startsWith(eventsDir)) {
						await reloadEvent(absPath, { retries: 5 });
					}
				})
				.on("change", async (absPath) => {
					if (!absPath.endsWith(".ts")) return;
					if (absPath.startsWith(commandsDir)) {
						await reloadCommand(absPath, { retries: 3 });
					} else if (absPath.startsWith(buttonsDir)) {
						await reloadButton(absPath, { retries: 3 });
					} else if (absPath.startsWith(eventsDir)) {
						await reloadEvent(absPath, { retries: 3 });
					}
				})
				.on("unlink", async (absPath) => {
					if (!absPath.endsWith(".ts")) return;
					if (absPath.startsWith(commandsDir)) {
						await deleteCommand(absPath);
					} else if (absPath.startsWith(buttonsDir)) {
						deleteButton(absPath);
					} else if (absPath.startsWith(eventsDir)) {
						deleteEvent(absPath);
					}
				});

			process.on("SIGINT", async () => {
				console.log(pc.dim("\nShutting down..."));
				await watcher.close();
				await client.destroy();
				process.exit(0);
			});
		});
}
