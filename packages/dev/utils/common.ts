import {
	DjsClient,
	type Command,
	type Button,
	type Route,
	type EventLister,
	type ContextMenu,
	type StringSelectMenu,
	type UserSelectMenu,
	type RoleSelectMenu,
	type ChannelSelectMenu,
	type MentionableSelectMenu,
} from "@djs-core/runtime";

type SelectMenu =
	| StringSelectMenu
	| UserSelectMenu
	| RoleSelectMenu
	| ChannelSelectMenu
	| MentionableSelectMenu;
import type { Config } from "../../utils/types/config";
import path, { resolve } from "path";
import fs from "fs/promises";
import pc from "picocolors";
import { Events } from "discord.js";

export const banner = `
   ${pc.bold(pc.blue("djs-core"))} ${pc.dim(`v1.0.0`)}
`;

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

	const commands: Route[] = [];
	const buttons: Button[] = [];
	const contextMenus: ContextMenu[] = [];
	const selectMenus: SelectMenu[] = [];
	const events: Record<string, EventLister> = {};
	const fileRouteMap = new Map<string, string>();
	const buttonFileRouteMap = new Map<string, string>();
	const contextMenuFileRouteMap = new Map<string, string>();
	const selectMenuFileRouteMap = new Map<string, string>();
	const eventFileIdMap = new Map<string, string>();

	commands.push(
		...(await scanCommands(
			path.join(root, "interactions", "commands"),
			"",
			fileRouteMap,
		)),
	);
	console.log(`${pc.green("✓")}  Loaded ${pc.bold(commands.length)} commands`);

	buttons.push(
		...(await scanButtons(
			path.join(root, "interactions", "buttons"),
			"",
			buttonFileRouteMap,
		)),
	);
	console.log(`${pc.green("✓")}  Loaded ${pc.bold(buttons.length)} buttons`);

	Object.assign(
		events,
		await scanEvents(path.join(root, "interactions", "events"), eventFileIdMap),
	);
	console.log(
		`${pc.green("✓")}  Loaded ${pc.bold(Object.keys(events).length)} events`,
	);

	contextMenus.push(
		...(await scanContextMenus(
			path.join(root, "interactions", "contexts"),
			"",
			contextMenuFileRouteMap,
		)),
	);
	console.log(
		`${pc.green("✓")}  Loaded ${pc.bold(contextMenus.length)} context menus`,
	);

	selectMenus.push(
		...(await scanSelectMenus(
			path.join(root, "interactions", "selects"),
			"",
			selectMenuFileRouteMap,
		)),
	);
	console.log(
		`${pc.green("✓")}  Loaded ${pc.bold(selectMenus.length)} select menus`,
	);

	const client = new DjsClient({ servers: config.servers });

	client.eventsHandler.set(events);

	console.log(pc.dim("Connecting to Discord..."));
	client.login(config.token);
	client.once(Events.ClientReady, () => {
		client.commandsHandler.set(commands);
		client.buttonsHandler.set(buttons);
		client.contextMenusHandler.set(contextMenus);
		client.selectMenusHandler.set(selectMenus);
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
		eventFileIdMap,
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

	// Create dir if not exists to avoid error
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
): Promise<Record<string, EventLister>> {
	const events: Record<string, EventLister> = {};

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
			const event = mod.default as EventLister;

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
