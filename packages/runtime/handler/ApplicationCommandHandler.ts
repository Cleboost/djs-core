import type {
	ApplicationCommand,
	ApplicationCommandDataResolvable,
	Collection,
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
} from "discord.js";
import type { DjsClient } from "../DjsClient";
import type Command from "../interaction/Command";
import type ContextMenu from "../interaction/ContextMenu";
import {
	applyDefaultMemberPermissions,
	buildCommandStructure,
	routesToEntries,
} from "../utils/compile-command";
import { isUnknownCommandError } from "../utils/discord-errors";
import { runtimeLog } from "../utils/logger";
import { getRoot } from "../utils/route";
import type { Route } from "./CommandHandler";

/**
 * Interface representing the JSON structure of any Discord command option.
 */
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

export default class ApplicationCommandHandler {
	private readonly client: DjsClient;
	private commands: Route[] = [];
	private contextMenus: ContextMenu[] = [];
	private guilds: string[] = [];
	private rootIdCache = new Map<string, Map<string, string>>();
	private hasWarnedEmptyContext = false;

	constructor(client: DjsClient) {
		this.client = client;
	}

	public setGuilds(guilds: string[]): void {
		this.guilds = guilds;
	}

	public setCommands(commands: Route[]): void {
		this.commands = commands;
	}

	public setContextMenus(contextMenus: ContextMenu[]): void {
		this.contextMenus = contextMenus;
	}

	public async sync(): Promise<void> {
		if (process.env.SKIP_SYNC) return;
		this.assertReady();

		if (!this.client.application) {
			throw new Error("Client application is not available");
		}

		const commandPayload = this.compileCommands();
		const allCommands: ApplicationCommandDataResolvable[] = [
			...commandPayload,
			...this.contextMenus,
		];

		const application = this.client.application;
		if (!application) {
			throw new Error("Client application is not available");
		}

		if (this.guilds.length > 0) {
			await Promise.all(
				this.guilds.map(async (guildId) => {
					try {
						const created = await application.commands.set(
							allCommands,
							guildId,
						);
						this.refreshCacheFromSetResult(created, guildId);
					} catch (error: unknown) {
						if (!isUnknownCommandError(error)) throw error;
					}
				}),
			);
		} else {
			try {
				const created = await application.commands.set(allCommands);
				this.refreshCacheFromSetResult(created, "global");
			} catch (error: unknown) {
				if (!isUnknownCommandError(error)) throw error;
			}
		}
	}

	private compileCommands(): ApplicationCommandDataResolvable[] {
		const roots = new Set(this.commands.map((r) => getRoot(r.route)));
		const payload: ApplicationCommandDataResolvable[] = [];

		for (const root of roots) {
			const compiled = this.compileRoot(root);
			if (compiled) payload.push(compiled);
		}

		return payload;
	}

	private compileRoot(root: string): ApplicationCommandDataResolvable | null {
		const entries = routesToEntries(this.commands, root);
		if (entries.length === 0) return null;

		const { subcommands, groups, builder } = buildCommandStructure(
			root,
			entries,
			(r) => this.getRootDescription(r),
		);

		if (
			subcommands.has("__root__") &&
			subcommands.size === 1 &&
			groups.size === 0
		) {
			// biome-ignore lint/style/noNonNullAssertion: guarded by subcommands.has("__root__") above
			const cmd = subcommands.get("__root__")!;
			if (!cmd.name) cmd.setName(root);
			this.applyDefaultContext(cmd, entries);
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
				this.copyOptionsToSubcommand(cmd, sc);
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
						this.copyOptionsToSubcommand(cmd, sc);
						return sc;
					});
				}
				return g;
			});
		}

		this.applyDefaultContext(builder, entries);
		applyDefaultMemberPermissions(builder, entries);
		const json = builder.toJSON();
		if (json.contexts && json.contexts.length === 0) delete json.contexts;
		return json;
	}

	private applyDefaultContext(
		target: Command | SlashCommandBuilder,
		routes: Array<{ parts: string[]; cmd: Command }>,
	): void {
		const defaultContext = this.client.getDjsConfig()?.commands?.defaultContext;
		if (!defaultContext) {
			return;
		}
		if (!Array.isArray(defaultContext) || defaultContext.length === 0) {
			if (!this.hasWarnedEmptyContext) {
				runtimeLog.warn(
					"config.commands.defaultContext is defined but empty — default context will not be applied",
				);
				this.hasWarnedEmptyContext = true;
			}
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

	private getRootDescription(root: string): string | undefined {
		const leaf = this.commands.find((r) => getRoot(r.route) === root);
		if (!leaf) return undefined;
		const cmd = leaf.command as SlashCommandBuilder & { description?: string };
		return cmd.description;
	}

	private refreshCacheFromSetResult(
		setResult: Collection<string, ApplicationCommand>,
		scope: string,
	): void {
		const map = new Map<string, string>();
		for (const cmd of setResult.values()) {
			map.set(cmd.name, cmd.id);
		}
		this.rootIdCache.set(scope, map);
	}

	private assertReady(): void {
		if (!this.client.isReady()) {
			throw new Error("Client is not ready");
		}
	}

	private copyOptionsToSubcommand(
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
				case 3: // STRING
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
				case 4: // INTEGER
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
				case 5: // BOOLEAN
					sc.addBooleanOption((opt) => {
						opt.setName(name).setDescription(description);
						if (required !== undefined) opt.setRequired(required);
						return opt;
					});
					break;
				case 6: // USER
					sc.addUserOption((opt) => {
						opt.setName(name).setDescription(description);
						if (required !== undefined) opt.setRequired(required);
						return opt;
					});
					break;
				case 7: // CHANNEL
					sc.addChannelOption((opt) => {
						opt.setName(name).setDescription(description);
						if (required !== undefined) opt.setRequired(required);
						if (channel_types && channel_types.length > 0)
							opt.addChannelTypes(...channel_types);
						return opt;
					});
					break;
				case 8: // ROLE
					sc.addRoleOption((opt) => {
						opt.setName(name).setDescription(description);
						if (required !== undefined) opt.setRequired(required);
						return opt;
					});
					break;
				case 9: // MENTIONABLE
					sc.addMentionableOption((opt) => {
						opt.setName(name).setDescription(description);
						if (required !== undefined) opt.setRequired(required);
						return opt;
					});
					break;
				case 10: // NUMBER
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
				case 11: // ATTACHMENT
					sc.addAttachmentOption((opt) => {
						opt.setName(name).setDescription(description);
						if (required !== undefined) opt.setRequired(required);
						return opt;
					});
					break;
			}
		}
	}
}
