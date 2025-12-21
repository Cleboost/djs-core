import type { CAC } from "cac";
import { banner, runBot } from "../utils/common";
import chokidar from "chokidar";
import path from "path";
import pc from "picocolors";
import type {
	Button,
	Command,
	ContextMenu,
	EventLister,
	StringSelectMenu,
	UserSelectMenu,
	RoleSelectMenu,
	ChannelSelectMenu,
	MentionableSelectMenu,
} from "@djs-core/runtime";

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
				fileRouteMap,
				buttonFileRouteMap,
				contextMenuFileRouteMap,
				selectMenuFileRouteMap,
				eventFileIdMap,
			} = await runBot(options.path);

			const dirs = {
				commands: path.join(root, "interactions", "commands"),
				buttons: path.join(root, "interactions", "buttons"),
				contexts: path.join(root, "interactions", "contexts"),
				selects: path.join(root, "interactions", "selects"),
				events: path.join(root, "interactions", "events"),
			};

			console.log(
				pc.dim(
					`\nWatching for changes in:\n${Object.values(dirs)
						.map((d) => ` - ${d}`)
						.join("\n")}\n`,
				),
			);

			// --- Helpers ---

			const sleep = (ms: number) =>
				new Promise<void>((resolve) => setTimeout(resolve, ms));

			function getRouteStandard(absPath: string, rootDir: string): string | null {
				const rel = path.relative(rootDir, absPath);
				if (!rel || rel.startsWith("..") || !rel.endsWith(".ts")) return null;
				const parts = rel.replace(/\.ts$/, "").split(path.sep);
				if (parts[parts.length - 1] === "index") parts.pop();
				return parts.length === 0 ? "index" : parts.join(".");
			}

			function getEventId(absPath: string): string | null {
				return absPath.endsWith(".ts") ? path.basename(absPath, ".ts") : null;
			}

			// --- Sync Logic ---

			const syncState = {
				timeout: null as ReturnType<typeof setTimeout> | null,
				pendingReloads: new Set<string>(),
				isSyncing: false,
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

			// --- Handlers Configuration ---

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
						await client.commandsHandler.add({ route, command: cmd });
					},
					unload: async (route) => client.commandsHandler.delete(route),
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
						if (!sm.data.custom_id) sm.setCustomId(route);
						client.selectMenusHandler.add(sm);
					},
					unload: async (route) => client.selectMenusHandler.delete(route),
				},
				{
					label: "event",
					dir: dirs.events,
					map: eventFileIdMap,
					getRoute: (_, __) => getEventId(_),
					load: async (mod, id) => {
						const ev = (mod as { default: EventLister }).default;
						if (ev) client.eventsHandler.add(id, ev);
					},
					unload: async (id) => {
						client.eventsHandler.remove(id);
					},
				},
			];

			// --- Unified Action Logic ---

			async function handleReload(
				absPath: string,
				config: HandlerConfig,
				retries = 0,
			): Promise<void> {
				const route = config.getRoute(absPath, config.dir);
				if (!route) return;

				if (config.sync) syncState.pendingReloads.add(absPath);

				try {
					const mod = await import(`${absPath}?t=${Date.now()}&r=${Math.random()}`);
					// Check if valid default export exists
					if (!mod.default) {
						if (retries > 0) {
							await sleep(150);
							return handleReload(absPath, config, retries - 1);
						}
						return;
					}

					// Clean up old route if changed
					const existingRoute = config.map.get(absPath);
					if (existingRoute && existingRoute !== route) {
						await config.unload(existingRoute);
					}

					console.log(`${pc.green(`✨ Reloading ${config.label}:`)} ${pc.bold(route)}`);
					
					// If replacing same route, unload first (some handlers require this, others replace)
					// ContextMenu/Command might benefit from clean add, but existing code mostly just overwrote or deleted then added.
					// ContextMenuHandler.add throws? No, it just overwrites in Map but calls API.
					// Event handler throws if exists.
					if (config.label === "event") {
						await config.unload(route);
					} else if (config.label === "context menu") {
						await config.unload(route);
					} else if (config.label === "select menu") {
						await config.unload(route);
					} 
					// ButtonHandler.add overwrites. CommandHandler.add overwrites.

					await config.load(mod, route, absPath);
					config.map.set(absPath, route);
					
					if (config.sync) requestSync();

				} catch (error: unknown) {
					if (retries > 0) {
						await sleep(150);
						return handleReload(absPath, config, retries - 1);
					}
					// Ignore 10063 (Unknown Application Command) usually during sync/delete
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
				}
			}

			async function handleDelete(absPath: string, config: HandlerConfig) {
				const route = config.map.get(absPath) ?? config.getRoute(absPath, config.dir);
				if (!route) return;

				console.log(`${pc.red(`🗑️  Deleting ${config.label}:`)} ${pc.bold(route)}`);
				await config.unload(route);
				config.map.delete(absPath);
				
				if (config.sync) {
					syncState.pendingReloads.delete(absPath);
					requestSync();
				}
			}

			// --- Watcher ---

			const watcher = chokidar.watch(Object.values(dirs), {
				ignoreInitial: true,
				ignored: /(^|[/\\])\../,
				usePolling: true,
				interval: 300,
				binaryInterval: 300,
			});

			const processFile = async (event: "add" | "change" | "unlink", absPath: string) => {
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

			process.on("SIGINT", async () => {
				console.log(pc.dim("\nShutting down..."));
				await watcher.close();
				await client.destroy();
				process.exit(0);
			});
		});
}
