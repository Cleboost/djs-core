import { SlashCommandBuilder } from "discord.js";
import type Command from "../interaction/Command";
import { splitRoute } from "./route";

interface RouteEntry {
	parts: string[];
	cmd: Command;
}

interface CommandStructure {
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
				groups.get(g)?.set(s, r.cmd);
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

type MemberPermissions = bigint | number | string | null | undefined;

function permissionKey(perms: MemberPermissions): string {
	return perms == null ? "__none__" : BigInt(perms).toString();
}

function formatPermissionLabel(key: string): string {
	return key === "__none__" ? "none (everyone)" : key;
}

function warnPermissionMismatch(
	root: string,
	routes: Array<{ parts: string[]; cmd: Command }>,
): void {
	if (routes.length <= 1) {
		return;
	}

	const byPermission = new Map<string, string[]>();
	for (const r of routes) {
		const key = permissionKey(r.cmd.default_member_permissions);
		const route = r.parts.join(".");
		const routesForKey = byPermission.get(key);
		if (routesForKey) routesForKey.push(route);
		else byPermission.set(key, [route]);
	}

	if (byPermission.size <= 1) {
		return;
	}

	const details = [...byPermission.entries()]
		.map(
			([key, routeLabels]) =>
				`  - ${routeLabels.join(", ")}: ${formatPermissionLabel(key)}`,
		)
		.join("\n");

	console.warn(
		`⚠️  Command '/${root}' has subcommands with different default_member_permissions. ` +
			"Discord only supports one permission set on the root command; merged permissions were applied.\n" +
			details,
	);
}

/**
 * Discord only supports default_member_permissions on the root slash command.
 * Merge permissions from all leaf commands (bitwise OR) onto the root builder.
 */
export function applyDefaultMemberPermissions(
	target: SlashCommandBuilder,
	routes: RouteEntry[],
): void {
	const root = routes[0]?.parts[0];
	if (root) {
		warnPermissionMismatch(root, routes);
	}

	let merged: bigint | null = null;

	for (const r of routes) {
		const perms = r.cmd.default_member_permissions;
		if (perms == null) continue;
		merged = merged == null ? BigInt(perms) : merged | BigInt(perms);
	}

	if (merged != null) {
		target.setDefaultMemberPermissions(merged);
	}
}
