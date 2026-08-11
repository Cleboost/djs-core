import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type Command from "../interaction/Command";
import { runtimeLog } from "./logger";
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
	if (key === "__none__") {
		return "everyone (no restriction)";
	}

	const value = BigInt(key);
	const names = Object.entries(PermissionFlagsBits)
		.filter(([, bit]) => typeof bit === "bigint" && (value & bit) === bit)
		.map(([name]) => name.replace(/([a-z])([A-Z])/g, "$1 $2"));

	if (names.length === 0) {
		return `custom (${key})`;
	}

	return `${names.join(" | ")} (${key})`;
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

	const rows = [...byPermission.entries()].flatMap(([key, routeLabels]) =>
		routeLabels.map((label) => ({
			label,
			value: formatPermissionLabel(key),
		})),
	);

	runtimeLog.warnBlock({
		title: `Permission mismatch on /${root}`,
		body: [
			"Discord only supports one permission set per root command.",
			"Merged permissions were applied (bitwise OR).",
		],
		rows,
	});
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
