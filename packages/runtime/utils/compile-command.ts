import {
	type ApplicationCommandDataResolvable,
	type InteractionContextType,
	PermissionFlagsBits,
	SlashCommandBuilder,
	type SlashCommandSubcommandBuilder,
} from "discord.js";
import type Command from "../interaction/Command";
import { runtimeLog } from "./logger";
import { getRoot, splitRoute } from "./route";

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

interface AnyOptionJson {
	name: string;
	description: string;
	type: number;
	required?: boolean;
	choices?: Array<{ name: string; value: string | number }>;
	autocomplete?: boolean;
	min_value?: number;
	max_value?: number;
	channel_types?: number[];
}

export interface CompileSlashCommandsOptions {
	defaultContext?: InteractionContextType[];
	onEmptyDefaultContext?: () => void;
}

function copyOptionsToSubcommand(
	cmd: Command,
	sc: SlashCommandSubcommandBuilder,
): void {
	for (const optionBuilder of cmd.options) {
		const optionJson = optionBuilder.toJSON() as unknown as AnyOptionJson;
		const {
			name,
			description,
			type,
			required,
			choices,
			autocomplete,
			min_value,
			max_value,
			channel_types,
		} = optionJson;

		if (!name || !description) continue;

		switch (type) {
			case 3:
				sc.addStringOption((opt) => {
					opt.setName(name).setDescription(description);
					if (required !== undefined) opt.setRequired(required);
					if (choices && choices.length > 0)
						opt.addChoices(
							...(choices as Array<{ name: string; value: string }>),
						);
					if (autocomplete !== undefined) opt.setAutocomplete(autocomplete);
					return opt;
				});
				break;
			case 4:
				sc.addIntegerOption((opt) => {
					opt.setName(name).setDescription(description);
					if (required !== undefined) opt.setRequired(required);
					if (choices && choices.length > 0)
						opt.addChoices(
							...(choices as Array<{ name: string; value: number }>),
						);
					if (min_value !== undefined) opt.setMinValue(min_value);
					if (max_value !== undefined) opt.setMaxValue(max_value);
					if (autocomplete !== undefined) opt.setAutocomplete(autocomplete);
					return opt;
				});
				break;
			case 5:
				sc.addBooleanOption((opt) => {
					opt.setName(name).setDescription(description);
					if (required !== undefined) opt.setRequired(required);
					return opt;
				});
				break;
			case 6:
				sc.addUserOption((opt) => {
					opt.setName(name).setDescription(description);
					if (required !== undefined) opt.setRequired(required);
					return opt;
				});
				break;
			case 7:
				sc.addChannelOption((opt) => {
					opt.setName(name).setDescription(description);
					if (required !== undefined) opt.setRequired(required);
					if (channel_types && channel_types.length > 0)
						opt.addChannelTypes(...channel_types);
					return opt;
				});
				break;
			case 8:
				sc.addRoleOption((opt) => {
					opt.setName(name).setDescription(description);
					if (required !== undefined) opt.setRequired(required);
					return opt;
				});
				break;
			case 9:
				sc.addMentionableOption((opt) => {
					opt.setName(name).setDescription(description);
					if (required !== undefined) opt.setRequired(required);
					return opt;
				});
				break;
			case 10:
				sc.addNumberOption((opt) => {
					opt.setName(name).setDescription(description);
					if (required !== undefined) opt.setRequired(required);
					if (choices && choices.length > 0)
						opt.addChoices(
							...(choices as Array<{ name: string; value: number }>),
						);
					if (min_value !== undefined) opt.setMinValue(min_value);
					if (max_value !== undefined) opt.setMaxValue(max_value);
					if (autocomplete !== undefined) opt.setAutocomplete(autocomplete);
					return opt;
				});
				break;
			case 11:
				sc.addAttachmentOption((opt) => {
					opt.setName(name).setDescription(description);
					if (required !== undefined) opt.setRequired(required);
					return opt;
				});
				break;
		}
	}
}

function applyDefaultContext(
	target: Command | SlashCommandBuilder,
	routes: RouteEntry[],
	options?: CompileSlashCommandsOptions,
): void {
	const defaultContext = options?.defaultContext;
	if (!defaultContext) {
		return;
	}
	if (!Array.isArray(defaultContext) || defaultContext.length === 0) {
		options?.onEmptyDefaultContext?.();
		return;
	}

	try {
		const targetJson = target.toJSON();
		if (targetJson.contexts && targetJson.contexts.length > 0) {
			return;
		}
	} catch {}

	for (const r of routes) {
		try {
			const cmdJson = r.cmd.toJSON();
			if (cmdJson.contexts && cmdJson.contexts.length > 0) {
				target.setContexts(cmdJson.contexts);
				return;
			}
		} catch {}
	}

	target.setContexts(defaultContext);
}

function getRootDescription(
	root: string,
	allRoutes: Array<{ route: string; command: Command }>,
): string | undefined {
	const leaf = allRoutes.find((r) => getRoot(r.route) === root);
	if (!leaf) return undefined;
	const cmd = leaf.command as SlashCommandBuilder & { description?: string };
	return cmd.description;
}

export function compileRootCommand(
	root: string,
	allRoutes: Array<{ route: string; command: Command }>,
	options?: CompileSlashCommandsOptions,
): ApplicationCommandDataResolvable | null {
	const entries = routesToEntries(allRoutes, root);
	if (entries.length === 0) return null;

	const { subcommands, groups, builder } = buildCommandStructure(
		root,
		entries,
		(r) => getRootDescription(r, allRoutes),
	);

	if (
		subcommands.has("__root__") &&
		subcommands.size === 1 &&
		groups.size === 0
	) {
		// biome-ignore lint/style/noNonNullAssertion: guarded by subcommands.has("__root__") above
		const cmd = subcommands.get("__root__")!;
		if (!cmd.name) cmd.setName(root);
		applyDefaultContext(cmd, entries, options);
		const json = cmd.toJSON();
		if (json.contexts && json.contexts.length === 0) delete json.contexts;
		return json;
	}

	for (const [name, cmd] of subcommands) {
		if (name === "__root__") continue;
		builder.addSubcommand((sc) => {
			sc.setName(name);
			const cmdWithDesc = cmd as SlashCommandBuilder & {
				description?: string;
			};
			sc.setDescription(cmdWithDesc.description ?? "No description");
			copyOptionsToSubcommand(cmd, sc);
			return sc;
		});
	}

	for (const [groupName, subs] of groups) {
		builder.addSubcommandGroup((g) => {
			g.setName(groupName);
			g.setDescription("No description");
			for (const [subName, cmd] of subs) {
				g.addSubcommand((sc) => {
					sc.setName(subName);
					const cmdWithDesc = cmd as SlashCommandBuilder & {
						description?: string;
					};
					sc.setDescription(cmdWithDesc.description ?? "No description");
					copyOptionsToSubcommand(cmd, sc);
					return sc;
				});
			}
			return g;
		});
	}

	applyDefaultContext(builder, entries, options);
	applyDefaultMemberPermissions(builder, entries);
	const json = builder.toJSON();
	if (json.contexts && json.contexts.length === 0) delete json.contexts;
	return json;
}

export function compileSlashCommands(
	commands: Array<{ route: string; command: Command }>,
	options?: CompileSlashCommandsOptions,
): ApplicationCommandDataResolvable[] {
	const roots = new Set(commands.map((r) => getRoot(r.route)));
	const payload: ApplicationCommandDataResolvable[] = [];

	for (const root of roots) {
		const compiled = compileRootCommand(root, commands, options);
		if (compiled) payload.push(compiled);
	}

	return payload;
}
