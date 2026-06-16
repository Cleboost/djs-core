import {
	type Button,
	type ChannelSelectMenu,
	type Command,
	type ContextMenu,
	DjsClient,
	type DjsClientInstance,
	type EventListener,
	getLeaf,
	type MentionableSelectMenu,
	type Modal,
	type RoleSelectMenu,
	type Route,
	type StringSelectMenu,
	type Task,
	type UserSelectMenu,
} from "@djs-core/runtime";

type SelectMenu =
	| StringSelectMenu
	| UserSelectMenu
	| RoleSelectMenu
	| ChannelSelectMenu
	| MentionableSelectMenu;

import { Events } from "discord.js";
import fs from "fs/promises";
import path, { resolve } from "path";
import pc from "picocolors";
import type { Config } from "../../utils/types/config";
import { autoGenerateConfigTypes } from "./config-type-generator";

export const banner = `
   ${pc.bold(pc.blue("djs-core"))} ${pc.dim(`v1.0.0`)}
`;

export const PATH_ALIASES = {
	components: "src/components",
	interactions: "src/interactions",
	events: "src/events",
} as const;

async function scanDir<T>(
	dir: string,
	prefix: string,
	map: Map<string, string> | undefined,
	process: (mod: { default: unknown }, route: string, fullPath: string) => T | null | undefined,
	recursive = true,
): Promise<T[]> {
	try {
		await fs.access(dir);
	} catch {
		return [];
	}

	const results: T[] = [];
	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (recursive && entry.isDirectory()) {
			const newPrefix = prefix ? `${prefix}.${entry.name}` : entry.name;
			results.push(...(await scanDir(fullPath, newPrefix, map, process)));
		} else if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
			const stem = entry.name.slice(0, -3);
			let route: string;

			if (recursive) {
				if (stem === "index") {
					if (!prefix) continue;
					route = prefix;
				} else {
					route = prefix ? `${prefix}.${stem}` : stem;
				}
			} else {
				route = stem;
			}

			const mod = await import(fullPath);
			if (!mod.default) continue;

			const result = process(mod as { default: unknown }, route, fullPath);
			if (result == null) continue;

			map?.set(fullPath, route);
			results.push(result);
		}
	}

	return results;
}

export async function runBot(projectPath: string) {
	const root = resolve(process.cwd(), projectPath);
	let configModule: { default: unknown };
	try {
		configModule = await import(`${path.join(root, "djs.config.ts")}?t=${Date.now()}`);
	} catch (err) {
		throw new Error(
			`Failed to load djs.config.ts: ${err instanceof Error ? err.message : String(err)}`,
		);
	}
	const config = configModule.default as Config;
	if (
		!config ||
		typeof config !== "object" ||
		!("token" in config) ||
		!("servers" in config)
	) {
		throw new Error(
			'Config is not a valid config. It must have "token" and "servers" properties.',
		);
	}

	console.log(`${pc.green("✓")}  Config loaded`);
	await autoGenerateConfigTypes(root, config);

	const fileRouteMap = new Map<string, string>();
	const buttonFileRouteMap = new Map<string, string>();
	const contextMenuFileRouteMap = new Map<string, string>();
	const selectMenuFileRouteMap = new Map<string, string>();
	const modalFileRouteMap = new Map<string, string>();
	const eventFileIdMap = new Map<string, string>();
	const cronFileIdMap = new Map<string, string>();

	const commands = await scanDir<Route>(
		path.join(root, PATH_ALIASES.interactions, "commands"),
		"", fileRouteMap,
		(mod, route) => ({ route, command: mod.default as Command }),
	);
	console.log(`${pc.green("✓")}  Loaded ${pc.bold(commands.length)} commands`);

	const buttons = await scanDir<Button>(
		path.join(root, PATH_ALIASES.components, "buttons"),
		"", buttonFileRouteMap,
		(mod, route) => {
			const btn = mod.default as Button;
			btn.setCustomId(route);
			return btn;
		},
	);
	console.log(`${pc.green("✓")}  Loaded ${pc.bold(buttons.length)} buttons`);

	const eventEntries = await scanDir<[string, EventListener]>(
		path.join(root, PATH_ALIASES.events),
		"", eventFileIdMap,
		(mod, id) => [id, mod.default as EventListener],
		false,
	);
	const events = Object.fromEntries(eventEntries);
	console.log(`${pc.green("✓")}  Loaded ${pc.bold(eventEntries.length)} events`);

	const contextMenus = await scanDir<ContextMenu>(
		path.join(root, PATH_ALIASES.interactions, "contexts"),
		"", contextMenuFileRouteMap,
		(mod, route) => {
			const cm = mod.default as ContextMenu;
			const leaf = getLeaf(route);
			if (leaf) cm.setName(leaf);
			return cm;
		},
	);
	console.log(`${pc.green("✓")}  Loaded ${pc.bold(contextMenus.length)} context menus`);

	const selectMenus = await scanDir<SelectMenu>(
		path.join(root, PATH_ALIASES.components, "selects"),
		"", selectMenuFileRouteMap,
		(mod, route) => {
			const sm = mod.default as SelectMenu;
			if (!sm.data.custom_id) sm.setCustomId(route);
			return sm;
		},
	);
	console.log(`${pc.green("✓")}  Loaded ${pc.bold(selectMenus.length)} select menus`);

	const modals = await scanDir<Modal>(
		path.join(root, PATH_ALIASES.components, "modals"),
		"", modalFileRouteMap,
		(mod, route) => {
			const modal = mod.default as Modal;
			modal.setCustomId(route);
			return modal;
		},
	);
	console.log(`${pc.green("✓")}  Loaded ${pc.bold(modals.length)} modals`);

	const tasks = new Map<string, Task>();
	if (config.experimental?.cron) {
		const cronEntries = await scanDir<[string, Task]>(
			path.join(root, "src", "cron"),
			"", cronFileIdMap,
			(mod, id) => [id, mod.default as Task],
			false,
		);
		for (const [id, task] of cronEntries) tasks.set(id, task);
		console.log(`${pc.green("✓")}  Loaded ${pc.bold(tasks.size)} cron tasks`);
	}

	let userConfig: unknown;
	if (config.experimental?.userConfig) {
		try {
			const configJsonPath = path.join(root, "config.json");
			const configJsonContent = await fs.readFile(configJsonPath, "utf-8");
			userConfig = JSON.parse(configJsonContent);
			console.log(`${pc.green("✓")}  User config loaded`);
		} catch {
			console.warn(
				pc.yellow("⚠️  userConfig is enabled but config.json not found or invalid"),
			);
		}
	}

	const client = new DjsClient({
		djsConfig: config,
		userConfig,
	}) as unknown as DjsClientInstance;
	await client.waitForPlugins();

	client.eventsHandler.set(events);

	console.log(pc.dim("Connecting to Discord..."));
	client.login(config.token).catch(
		// biome-ignore lint/suspicious/noExplicitAny: error handling
		(error: any) => {
			console.error(`${pc.red("✗")} ${pc.bold("Failed to connect to Discord")}`);
			console.error(pc.dim("Error: ") + pc.red(error.message || String(error)));
			if (error.message?.includes("token") || error.message?.includes("401")) {
				console.error(
					pc.yellow("\n💡 Tip: ") +
						pc.dim("Vérifiez que votre token Discord est valide dans djs.config.ts"),
				);
			}
			process.exit(1);
		},
	);

	client.once(Events.ClientReady, async () => {
		client.commandsHandler.set(commands);
		client.contextMenusHandler.set(contextMenus);
		client.applicationCommandHandler.setCommands(commands);
		client.applicationCommandHandler.setContextMenus(
			client.contextMenusHandler.getContextMenus(),
		);
		await client.applicationCommandHandler.sync();
		client.buttonsHandler.set(buttons);
		client.selectMenusHandler.set(selectMenus);
		client.modalsHandler.set(modals);
		if (config.experimental?.cron && tasks.size > 0) {
			client.cronHandler.set(tasks);
		}
		console.log(
			pc.green("🚀 Bot is ready! ") +
				pc.dim(`Logged in as ${client.user?.tag}`),
		);
	});

	return {
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
	};
}
