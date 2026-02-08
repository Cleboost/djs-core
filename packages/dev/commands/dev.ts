import type {
	Button,
	Command,
	ContextMenu,
	EventListner,
	Task,
} from "@djs-core/runtime";
import {
	ChannelSelectMenu,
	MentionableSelectMenu,
	RoleSelectMenu,
	StringSelectMenu,
	UserSelectMenu,
} from "@djs-core/runtime";
import type { CAC } from "cac";
import chokidar, { type FSWatcher } from "chokidar";
import path from "path";
import pc from "picocolors";
import { banner, PATH_ALIASES, runBot } from "../utils/common";
import { autoGenerateConfigTypes } from "../utils/config-type-generator";

type SelectMenu =
	| StringSelectMenu
	| UserSelectMenu
	| RoleSelectMenu
	| ChannelSelectMenu
	| MentionableSelectMenu;

interface HandlerConfig {
	label: string;
	dir: string;
	map: Map<string, string>; // absPath -> route/id
	getRoute: (absPath: string, rootDir: string) => string | null;
	load: (
		mod: { default: unknown },
		route: string,
		absPath: string,
	) => Promise<void> | void;
	unload: (route: string) => Promise<void> | void;
	sync?: boolean;
}

export function registerDevCommand(cli: CAC) {
	cli
		.command("dev", "Start the bot in development mode")
		.option("-p, --path", "Custom project path", { default: "." })
		.action(async (options) => {
			console.log(banner);
			console.log(`${pc.cyan("ℹ")}  Starting development server...`);

			const {
				client,
				root,
				config,
				fileRouteMap,
				buttonFileRouteMap,
				contextMenuFileRouteMap,
				selectMenuFileRouteMap,
				modalFileRouteMap,
				eventFileIdMap,
				cronFileIdMap,
			} = await runBot(options.path);

			const dirs = {
				commands: path.join(root, PATH_ALIASES.interactions, "commands"),
				buttons: path.join(root, PATH_ALIASES.components, "buttons"),
				contexts: path.join(root, PATH_ALIASES.interactions, "contexts"),
				selects: path.join(root, PATH_ALIASES.components, "selects"),
				modals: path.join(root, PATH_ALIASES.components, "modals"),
				events: path.join(root, PATH_ALIASES.events),
				cron: config.experimental?.cron ? path.join(root, "src", "cron") : null,
			};

			console.log(
				pc.dim(
					`\nWatching for changes in:\n${Object.values(dirs)
						.filter((d) => d !== null)
						.map((d) => ` - ${d}`)
						.join("\n")}\n`,
				),
			);

			const sleep = (ms: number) =>
				new Promise<void>((resolve) => setTimeout(resolve, ms));

			function getRouteStandard(
				absPath: string,
				rootDir: string,
			): string | null {
				const rel = path.relative(rootDir, absPath);
				if (!rel || rel.startsWith("..") || !rel.endsWith(".ts")) return null;
				const parts = rel.replace(/\.ts$/, "").split(path.sep);
				if (parts[parts.length - 1] === "index") parts.pop();
				return parts.length === 0 ? "index" : parts.join(".");
			}

			function getEventId(absPath: string): string | null {
				return absPath.endsWith(".ts") ? path.basename(absPath, ".ts") : null;
			}

			function getCronId(absPath: string): string | null {
				return absPath.endsWith(".ts") ? path.basename(absPath, ".ts") : null;
			}

			const syncState = {
				timeout: null as ReturnType<typeof setTimeout> | null,
				pendingReloads: new Set<string>(),
				isSyncing: false,
			};

			const reloadState = {
				timeouts: new Map<string, ReturnType<typeof setTimeout>>(),
				reloading: new Set<string>(),
			};

			async function syncCommands() {
				if (syncState.isSyncing) return;
				syncState.isSyncing = true;
				try {
					client.applicationCommandHandler.setCommands(
						client.commandsHandler.getRoutes(),
					);
					client.applicationCommandHandler.setContextMenus(
						client.contextMenusHandler.getContextMenus(),
					);
					await client.applicationCommandHandler.sync();
				} catch (error: unknown) {
					if (
						error &&
						typeof error === "object" &&
						"code" in error &&
						(error as { code: number }).code !== 10063
					) {
						console.error(pc.red(`❌ Error syncing commands:`), error);
					}
				} finally {
					syncState.isSyncing = false;
					syncState.pendingReloads.clear();
				}
			}

			function requestSync() {
				if (syncState.timeout) clearTimeout(syncState.timeout);
				syncState.timeout = setTimeout(() => syncCommands(), 300);
			}

			const handlers: HandlerConfig[] = [
				{
					label: "route",
					dir: dirs.commands,
					map: fileRouteMap,
					getRoute: getRouteStandard,
					load: async (mod, route) => {
						const cmd = (mod as { default: Command }).default;
						if (!cmd) return;
						const leaf = route.split(".").pop();
						if (leaf) cmd.setName(leaf);
						await client.commandsHandler.add({ route, command: cmd }, true);
					},
					unload: async (route) => {
						await client.commandsHandler.delete(route, true);
					},
					sync: true,
				},
				{
					label: "button",
					dir: dirs.buttons,
					map: buttonFileRouteMap,
					getRoute: getRouteStandard,
					load: async (mod, route) => {
						const btn = (mod as { default: Button }).default;
						if (!btn) return;
						btn.setCustomId(route);
						client.buttonsHandler.add(btn);
					},
					unload: async (route) => client.buttonsHandler.delete(route),
				},
				{
					label: "context menu",
					dir: dirs.contexts,
					map: contextMenuFileRouteMap,
					getRoute: getRouteStandard,
					load: async (mod, route) => {
						const cm = (mod as { default: ContextMenu }).default;
						if (!cm) return;
						const leaf = route.split(".").pop();
						if (leaf) cm.setName(leaf);
						await client.contextMenusHandler.add(cm);
					},
					unload: async (route) => client.contextMenusHandler.delete(route),
					sync: true,
				},
				{
					label: "select menu",
					dir: dirs.selects,
					map: selectMenuFileRouteMap,
					getRoute: getRouteStandard,
					load: async (mod, route) => {
						const sm = (mod as { default: SelectMenu }).default;
						if (!sm) return;
						if (
							sm instanceof StringSelectMenu ||
							sm instanceof UserSelectMenu ||
							sm instanceof RoleSelectMenu ||
							sm instanceof ChannelSelectMenu ||
							sm instanceof MentionableSelectMenu
						) {
							if (!sm.baseCustomId) sm.setCustomId(route);
						}
						client.selectMenusHandler.add(sm);
					},
					unload: async (route) => client.selectMenusHandler.delete(route),
				},
				{
					label: "modal",
					dir: dirs.modals,
					map: modalFileRouteMap,
					getRoute: getRouteStandard,
					load: async (mod, route) => {
						const modal = (
							mod as { default: import("@djs-core/runtime").Modal }
						).default;
						if (!modal) return;
						modal.setCustomId(route);
						client.modalsHandler.add(modal);
					},
					unload: async (route) => client.modalsHandler.delete(route),
				},
				{
					label: "event",
					dir: dirs.events,
					map: eventFileIdMap,
					getRoute: (_, __) => getEventId(_),
					load: async (mod, id) => {
						const ev = (mod as { default: EventListner }).default;
						if (ev) client.eventsHandler.add(id, ev);
					},
					unload: async (id) => {
						client.eventsHandler.remove(id);
					},
				},
			];

			if (config.experimental?.cron && dirs.cron) {
				handlers.push({
					label: "cron task",
					dir: dirs.cron,
					map: cronFileIdMap,
					getRoute: (_, __) => getCronId(_),
					load: async (mod, id) => {
						const task = (mod as { default: Task }).default;
						if (task) client.cronHandler.add(id, task);
					},
					unload: async (id) => {
						client.cronHandler.remove(id);
					},
				});
			}

			async function handleReload(
				absPath: string,
				config: HandlerConfig,
				retries = 0,
			): Promise<void> {
				const route = config.getRoute(absPath, config.dir);
				if (!route) return;

				const existingTimeout = reloadState.timeouts.get(absPath);
				if (existingTimeout) {
					clearTimeout(existingTimeout);
				}
				if (reloadState.reloading.has(absPath)) {
					return;
				}

				reloadState.reloading.add(absPath);
				reloadState.timeouts.set(
					absPath,
					setTimeout(() => {
						reloadState.reloading.delete(absPath);
						reloadState.timeouts.delete(absPath);
					}, 100),
				);

				if (config.sync) syncState.pendingReloads.add(absPath);

				try {
					const mod = await import(
						`${absPath}?t=${Date.now()}&r=${Math.random()}`
					);
					if (!mod.default) {
						if (retries > 0) {
							await sleep(150);
							return handleReload(absPath, config, retries - 1);
						}
						return;
					}

					const existingRoute = config.map.get(absPath);
					if (existingRoute && existingRoute !== route) {
						await config.unload(existingRoute);
					}

					console.log(
						`${pc.green(`✨ Reloading ${config.label}:`)} ${pc.bold(route)}`,
					);

					if (config.label === "event") {
						await config.unload(route);
					} else if (config.label === "context menu") {
						await config.unload(route);
					} else if (config.label === "select menu") {
						await config.unload(route);
					} else if (config.label === "route") {
						await config.unload(route);
					} else if (config.label === "modal") {
						await config.unload(route);
					}

					await config.load(mod, route, absPath);
					config.map.set(absPath, route);

					if (config.sync) requestSync();
					reloadState.reloading.delete(absPath);
					reloadState.timeouts.delete(absPath);
				} catch (error: unknown) {
					if (retries > 0) {
						await sleep(150);
						return handleReload(absPath, config, retries - 1);
					}
					if (
						!error ||
						typeof error !== "object" ||
						!("code" in error) ||
						(error as { code: number }).code !== 10063
					) {
						console.error(
							pc.red(`❌ Error reloading ${config.label} ${absPath}:`),
							error,
						);
					}
					if (config.sync) syncState.pendingReloads.delete(absPath);
					reloadState.reloading.delete(absPath);
					reloadState.timeouts.delete(absPath);
				}
			}

			async function handleDelete(absPath: string, config: HandlerConfig) {
				const route =
					config.map.get(absPath) ?? config.getRoute(absPath, config.dir);
				if (!route) return;

				console.log(
					`${pc.red(`🗑️  Deleting ${config.label}:`)} ${pc.bold(route)}`,
				);
				await config.unload(route);
				config.map.delete(absPath);

				if (config.sync) {
					syncState.pendingReloads.delete(absPath);
					requestSync();
				}
			}

			const watcher = chokidar.watch(
				Object.values(dirs).filter((d) => d !== null) as string[],
				{
					ignoreInitial: true,
					ignored: /(^|[/\\])\../,
					usePolling: true,
					interval: 300,
					binaryInterval: 300,
				},
			);

			const processFile = async (
				event: "add" | "change" | "unlink",
				absPath: string,
			) => {
				if (!absPath.endsWith(".ts")) return;
				const config = handlers.find((h) => absPath.startsWith(h.dir));
				if (!config) return;

				if (event === "unlink") {
					await handleDelete(absPath, config);
				} else {
					await handleReload(absPath, config, event === "add" ? 5 : 3);
				}
			};

			watcher
				.on("add", (p) => processFile("add", p))
				.on("change", (p) => processFile("change", p))
				.on("unlink", (p) => processFile("unlink", p));

			let configWatcher: FSWatcher | null = null;
			if (config.experimental?.userConfig) {
				const configJsonPath = path.join(root, "config.json");
				configWatcher = chokidar.watch(configJsonPath, {
					ignoreInitial: true,
				});

				configWatcher.on("change", async () => {
					console.log(
						`${pc.cyan("ℹ")}  config.json changed, regenerating types...`,
					);
					await autoGenerateConfigTypes(root);
				});

				configWatcher.on("add", async () => {
					console.log(
						`${pc.green("✓")}  config.json created, generating types...`,
					);
					await autoGenerateConfigTypes(root);
				});
			}

			process.on("SIGINT", async () => {
				console.log(pc.dim("\nShutting down..."));
				await watcher.close();
				if (configWatcher) {
					await configWatcher.close();
				}
				await client.destroy();
				process.exit(0);
			});
		});
}
