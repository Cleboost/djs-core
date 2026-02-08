import {
	type Button,
	type ChannelSelectMenu,
	type Command,
	type ContextMenu,
	DjsClient,
	type EventListner,
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

export async function runBot(projectPath: string) {
	const root = resolve(process.cwd(), projectPath);
	const configModule = await import(path.join(root, "djs.config.ts"));
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

	// Auto-generate config types if userConfig is enabled
	if (config.experimental?.userConfig) {
		await autoGenerateConfigTypes(root);
	}

	const commands: Route[] = [];
	const buttons: Button[] = [];
	const contextMenus: ContextMenu[] = [];
	const selectMenus: SelectMenu[] = [];
	const modals: Modal[] = [];
	const events: Record<string, EventListner> = {};
	const tasks = new Map<string, Task>();
	const fileRouteMap = new Map<string, string>();
	const buttonFileRouteMap = new Map<string, string>();
	const contextMenuFileRouteMap = new Map<string, string>();
	const selectMenuFileRouteMap = new Map<string, string>();
	const modalFileRouteMap = new Map<string, string>();
	const eventFileIdMap = new Map<string, string>();
	const cronFileIdMap = new Map<string, string>();

	commands.push(
		...(await scanCommands(
			path.join(root, PATH_ALIASES.interactions, "commands"),
			"",
			fileRouteMap,
		)),
	);
	console.log(`${pc.green("✓")}  Loaded ${pc.bold(commands.length)} commands`);

	buttons.push(
		...(await scanButtons(
			path.join(root, PATH_ALIASES.components, "buttons"),
			"",
			buttonFileRouteMap,
		)),
	);
	console.log(`${pc.green("✓")}  Loaded ${pc.bold(buttons.length)} buttons`);

	Object.assign(
		events,
		await scanEvents(path.join(root, PATH_ALIASES.events), eventFileIdMap),
	);
	console.log(
		`${pc.green("✓")}  Loaded ${pc.bold(Object.keys(events).length)} events`,
	);

	contextMenus.push(
		...(await scanContextMenus(
			path.join(root, PATH_ALIASES.interactions, "contexts"),
			"",
			contextMenuFileRouteMap,
		)),
	);
	console.log(
		`${pc.green("✓")}  Loaded ${pc.bold(contextMenus.length)} context menus`,
	);

	selectMenus.push(
		...(await scanSelectMenus(
			path.join(root, PATH_ALIASES.components, "selects"),
			"",
			selectMenuFileRouteMap,
		)),
	);
	console.log(
		`${pc.green("✓")}  Loaded ${pc.bold(selectMenus.length)} select menus`,
	);

	modals.push(
		...(await scanModals(
			path.join(root, PATH_ALIASES.components, "modals"),
			"",
			modalFileRouteMap,
		)),
	);
	console.log(`${pc.green("✓")}  Loaded ${pc.bold(modals.length)} modals`);

	if (config.experimental?.cron) {
		const cronTasks = await scanCron(
			path.join(root, "src", "cron"),
			cronFileIdMap,
		);
		for (const [id, task] of cronTasks.entries()) {
			tasks.set(id, task);
		}
		console.log(`${pc.green("✓")}  Loaded ${pc.bold(tasks.size)} cron tasks`);
	}

	let userConfig: unknown;
	if (config.experimental?.userConfig) {
		try {
			const configJsonPath = path.join(root, "config.json");
			const configJsonContent = await fs.readFile(configJsonPath, "utf-8");
			userConfig = JSON.parse(configJsonContent);
			console.log(`${pc.green("✓")}  User config loaded`);
		} catch (_error) {
			console.warn(
				pc.yellow(
					"⚠️  userConfig is enabled but config.json not found or invalid",
				),
			);
		}
	}

	const client = new DjsClient({ djsConfig: config, userConfig });

	client.eventsHandler.set(events);

	console.log(pc.dim("Connecting to Discord..."));
	client.login(config.token).catch((error) => {
		console.error(`${pc.red("✗")} ${pc.bold("Failed to connect to Discord")}`);
		console.error(pc.dim("Error: ") + pc.red(error.message || String(error)));
		if (error.message?.includes("token") || error.message?.includes("401")) {
			console.error(
				pc.yellow("\n💡 Tip: ") +
					pc.dim(
						"Vérifiez que votre token Discord est valide dans djs.config.ts",
					),
			);
		}
		process.exit(1);
	});
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

async function scanButtons(
	dir: string,
	prefix: string = "",
	map?: Map<string, string>,
): Promise<Button[]> {
	const buttons: Button[] = [];
	try {
		await fs.access(dir);
	} catch {
		return [];
	}

	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			const newPrefix = prefix ? `${prefix}.${entry.name}` : entry.name;
			buttons.push(...(await scanButtons(fullPath, newPrefix, map)));
		} else if (entry.isFile() && entry.name.endsWith(".ts")) {
			const mod = await import(fullPath);
			const button = mod.default as Button;

			const routeName = entry.name.replace(".ts", "");
			let route = "";

			if (routeName === "index") {
				if (prefix) route = prefix;
			} else {
				route = prefix ? `${prefix}.${routeName}` : routeName;
			}

			if (!route) continue;

			// derive customId from route for consistency
			button.setCustomId(route);

			if (map) map.set(fullPath, route);
			buttons.push(button);
		}
	}

	return buttons;
}

async function scanCommands(
	dir: string,
	prefix: string = "",
	map?: Map<string, string>,
): Promise<Route[]> {
	const routes: Route[] = [];

	try {
		await fs.access(dir);
	} catch {
		return [];
	}

	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			const newPrefix = prefix ? `${prefix}.${entry.name}` : entry.name;
			routes.push(...(await scanCommands(fullPath, newPrefix, map)));
		} else if (entry.isFile() && entry.name.endsWith(".ts")) {
			const commandModule = await import(fullPath);
			const command = commandModule.default as Command;

			const routeName = entry.name.replace(".ts", "");
			let route = "";

			if (routeName === "index") {
				if (prefix) {
					route = prefix;
				}
			} else {
				route = prefix ? `${prefix}.${routeName}` : routeName;
			}

			if (route) {
				if (map) map.set(fullPath, route);
				routes.push({ route: route, command });
			}
		}
	}
	return routes;
}

async function scanEvents(
	dir: string,
	map?: Map<string, string>,
): Promise<Record<string, EventListner>> {
	const events: Record<string, EventListner> = {};

	try {
		await fs.access(dir);
	} catch {
		return {};
	}

	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isFile() && entry.name.endsWith(".ts")) {
			const mod = await import(fullPath);
			const event = mod.default as EventListner;

			if (!event) continue;

			const eventId = entry.name.replace(".ts", "");

			if (map) map.set(fullPath, eventId);
			events[eventId] = event;
		}
	}

	return events;
}

async function scanContextMenus(
	dir: string,
	prefix: string = "",
	map?: Map<string, string>,
): Promise<ContextMenu[]> {
	const contextMenus: ContextMenu[] = [];

	try {
		await fs.access(dir);
	} catch {
		return [];
	}

	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			const newPrefix = prefix ? `${prefix}.${entry.name}` : entry.name;
			contextMenus.push(...(await scanContextMenus(fullPath, newPrefix, map)));
		} else if (entry.isFile() && entry.name.endsWith(".ts")) {
			const mod = await import(fullPath);
			const contextMenu = mod.default as ContextMenu;

			if (!contextMenu) continue;

			const routeName = entry.name.replace(".ts", "");
			let route = "";

			if (routeName === "index") {
				if (prefix) route = prefix;
			} else {
				route = prefix ? `${prefix}.${routeName}` : routeName;
			}

			if (!route) continue;

			const parts = route.split(".");
			const leaf = parts[parts.length - 1];
			if (leaf) contextMenu.setName(leaf);

			if (map) map.set(fullPath, route);
			contextMenus.push(contextMenu);
		}
	}

	return contextMenus;
}

async function scanSelectMenus(
	dir: string,
	prefix: string = "",
	map?: Map<string, string>,
): Promise<SelectMenu[]> {
	const selectMenus: SelectMenu[] = [];

	try {
		await fs.access(dir);
	} catch {
		return [];
	}

	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			const newPrefix = prefix ? `${prefix}.${entry.name}` : entry.name;
			selectMenus.push(...(await scanSelectMenus(fullPath, newPrefix, map)));
		} else if (entry.isFile() && entry.name.endsWith(".ts")) {
			const mod = await import(fullPath);
			const selectMenu = mod.default as SelectMenu | undefined;

			if (!selectMenu) continue;

			const routeName = entry.name.replace(".ts", "");
			let route = "";

			if (routeName === "index") {
				if (prefix) route = prefix;
			} else {
				route = prefix ? `${prefix}.${routeName}` : routeName;
			}

			if (!route) continue;

			const customId = selectMenu.data.custom_id;
			if (!customId) {
				selectMenu.setCustomId(route);
			}

			if (map) map.set(fullPath, route);
			selectMenus.push(selectMenu);
		}
	}

	return selectMenus;
}

async function scanModals(
	dir: string,
	prefix: string = "",
	map?: Map<string, string>,
): Promise<Modal[]> {
	const modals: Modal[] = [];

	try {
		await fs.access(dir);
	} catch {
		return [];
	}

	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			const newPrefix = prefix ? `${prefix}.${entry.name}` : entry.name;
			modals.push(...(await scanModals(fullPath, newPrefix, map)));
		} else if (entry.isFile() && entry.name.endsWith(".ts")) {
			const mod = await import(fullPath);
			const modal = mod.default as Modal | undefined;

			if (!modal) continue;

			const routeName = entry.name.replace(".ts", "");
			let route = "";

			if (routeName === "index") {
				if (prefix) route = prefix;
			} else {
				route = prefix ? `${prefix}.${routeName}` : routeName;
			}

			if (!route) continue;

			modal.setCustomId(route);

			if (map) map.set(fullPath, route);
			modals.push(modal);
		}
	}

	return modals;
}

async function scanCron(
	dir: string,
	map?: Map<string, string>,
): Promise<Map<string, Task>> {
	const tasks = new Map<string, Task>();

	try {
		await fs.access(dir);
	} catch {
		return tasks;
	}

	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isFile() && entry.name.endsWith(".ts")) {
			const mod = await import(fullPath);
			const task = mod.default as Task | undefined;

			if (!task) continue;

			const taskId = entry.name.replace(".ts", "");

			if (map) map.set(fullPath, taskId);
			tasks.set(taskId, task);
		}
	}

	return tasks;
}
