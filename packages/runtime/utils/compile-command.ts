import { SlashCommandBuilder } from "discord.js";
import type Command from "../interaction/Command";
import { splitRoute } from "./route";

export interface RouteEntry {
	parts: string[];
	cmd: Command;
}

export interface CommandStructure {
	subcommands: Map<string, Command>;
	groups: Map<string, Map<string, Command>>;
	builder: SlashCommandBuilder;
	routes: RouteEntry[];
}

export function buildCommandStructure(
	root: string,
	routes: RouteEntry[],
	getRootDescription: (root: string) => string | undefined,
): CommandStructure {
	const subcommands = new Map<string, Command>();
	const groups = new Map<string, Map<string, Command>>();

	for (const r of routes) {
		const parts = r.parts;

		if (parts.length === 1) {
			subcommands.set("__root__", r.cmd);
			continue;
		}

		if (parts.length === 2) {
			const subcommandName = parts[1];
			if (subcommandName) subcommands.set(subcommandName, r.cmd);
			continue;
		}

		if (parts.length === 3) {
			const g = parts[1];
			const s = parts[2];
			if (g && s) {
				if (!groups.has(g)) groups.set(g, new Map());
				groups.get(g)!.set(s, r.cmd);
			}
			continue;
		}

		throw new Error(
			`Route too deep: "${parts.join(".")}" has ${parts.length} levels (max 3: root.group.subcommand). ` +
				`Check your folder structure in src/interactions/commands.`,
		);
	}

	const builder = new SlashCommandBuilder()
		.setName(root)
		.setDescription(getRootDescription(root) ?? "No description");

	return { subcommands, groups, builder, routes };
}

export function routesToEntries(
	allRoutes: Array<{ route: string; command: Command }>,
	root: string,
): RouteEntry[] {
	return allRoutes
		.filter((r) => {
			const parts = splitRoute(r.route);
			return parts[0] === root;
		})
		.map((r) => ({ parts: splitRoute(r.route), cmd: r.command }));
}
