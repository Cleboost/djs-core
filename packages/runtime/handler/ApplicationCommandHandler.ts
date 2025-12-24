import type {
	ApplicationCommand,
	ApplicationCommandDataResolvable,
	Collection,
} from "discord.js";
import {
	SlashCommandBuilder,
	type SlashCommandSubcommandBuilder,
} from "discord.js";
import type DjsClient from "../DjsClient";
import type Command from "../interaction/Command";
import type ContextMenu from "../interaction/ContextMenu";
import type { Route } from "./CommandHandler";

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
		this.assertReady();

		if (!this.client.application) {
			throw new Error("Client application is not available");
		}

		const commandPayload = this.compileCommands();
		const allCommands: ApplicationCommandDataResolvable[] = [
			...commandPayload,
			...this.contextMenus,
		];

		if (this.guilds.length > 0) {
			for (const guildId of this.guilds) {
				try {
					const created = await this.client.application.commands.set(
						allCommands,
						guildId,
					);
					this.refreshCacheFromSetResult(created, guildId);
				} catch (error: unknown) {
					if (
						error &&
						typeof error === "object" &&
						"code" in error &&
						error.code === 10063
					) {
						continue;
					}
					throw error;
				}
			}
		} else {
			try {
				const created = await this.client.application.commands.set(allCommands);
				this.refreshCacheFromSetResult(created, "global");
			} catch (error: unknown) {
				if (
					error &&
					typeof error === "object" &&
					"code" in error &&
					error.code === 10063
				) {
					return;
				}
				throw error;
			}
		}
	}

	private compileCommands(): ApplicationCommandDataResolvable[] {
		const roots = new Set(this.commands.map((r) => this.getRoot(r.route)));
		const payload: ApplicationCommandDataResolvable[] = [];

		for (const root of roots) {
			const compiled = this.compileRoot(root);
			if (compiled) payload.push(compiled);
		}

		return payload;
	}

	private compileRoot(root: string): ApplicationCommandDataResolvable | null {
		const routes = this.commands
			.filter((r) => this.getRoot(r.route) === root)
			.map((r) => ({ parts: this.splitRoute(r.route), cmd: r.command }));

		if (routes.length === 0) return null;

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
				if (subcommandName) {
					subcommands.set(subcommandName, r.cmd);
				}
				continue;
			}

			if (parts.length === 3) {
				const g = parts[1];
				const s = parts[2];
				if (g && s) {
					if (!groups.has(g)) groups.set(g, new Map());
					const groupMap = groups.get(g);
					if (groupMap) {
						groupMap.set(s, r.cmd);
					}
				}
				continue;
			}

			throw new Error(`Route too deep: ${parts.join(".")}`);
		}

		const builder = new SlashCommandBuilder()
			.setName(root)
			.setDescription(this.getRootDescription(root) ?? "No description");

		if (
			subcommands.has("__root__") &&
			subcommands.size === 1 &&
			groups.size === 0
		) {
			const cmd = subcommands.get("__root__");
			if (!cmd) {
				throw new Error("Root command not found in subcommands");
			}
			if (!cmd.name) {
				cmd.setName(root);
			}
			this.applyDefaultContext(cmd, routes);
			const json = cmd.toJSON();
			if (json.contexts && json.contexts.length === 0) {
				delete json.contexts;
			}
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

		this.applyDefaultContext(builder, routes);
		const json = builder.toJSON();
		if (json.contexts && json.contexts.length === 0) {
			delete json.contexts;
		}
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
				console.warn(
					"⚠️  config.commands.defaultContext is defined but empty. Default context will not be applied.",
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
		const leaf = this.commands.find((r) => r.route === root);
		if (!leaf) return undefined;
		const cmd = leaf.command as SlashCommandBuilder & { description?: string };
		return cmd.description;
	}

	private splitRoute(route: string): string[] {
		return route
			.split(".")
			.map((s) => s.trim())
			.filter(Boolean);
	}

	private getRoot(route: string): string {
		const parts = this.splitRoute(route);
		const root = parts[0];
		if (!root) {
			throw new Error(`Route '${route}' has no root part`);
		}
		return root;
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
			const optionJson = optionBuilder.toJSON();
			if (!optionJson.name || !optionJson.description) {
				continue;
			}

			switch (optionJson.type) {
				case 3: // STRING
					sc.addStringOption((opt) => {
						opt.setName(optionJson.name).setDescription(optionJson.description);
						if (optionJson.required !== undefined)
							opt.setRequired(optionJson.required);
						if (optionJson.choices && optionJson.choices.length > 0)
							opt.addChoices(...optionJson.choices);
						if (optionJson.autocomplete !== undefined)
							opt.setAutocomplete(optionJson.autocomplete);
						return opt;
					});
					break;
				case 4: // INTEGER
					sc.addIntegerOption((opt) => {
						opt.setName(optionJson.name).setDescription(optionJson.description);
						if (optionJson.required !== undefined)
							opt.setRequired(optionJson.required);
						if (optionJson.choices && optionJson.choices.length > 0)
							opt.addChoices(...optionJson.choices);
						if (optionJson.min_value !== undefined)
							opt.setMinValue(optionJson.min_value);
						if (optionJson.max_value !== undefined)
							opt.setMaxValue(optionJson.max_value);
						if (optionJson.autocomplete !== undefined)
							opt.setAutocomplete(optionJson.autocomplete);
						return opt;
					});
					break;
				case 5: // BOOLEAN
					sc.addBooleanOption((opt) => {
						opt.setName(optionJson.name).setDescription(optionJson.description);
						if (optionJson.required !== undefined)
							opt.setRequired(optionJson.required);
						return opt;
					});
					break;
				case 6: // USER
					sc.addUserOption((opt) => {
						opt.setName(optionJson.name).setDescription(optionJson.description);
						if (optionJson.required !== undefined)
							opt.setRequired(optionJson.required);
						return opt;
					});
					break;
				case 7: // CHANNEL
					sc.addChannelOption((opt) => {
						opt.setName(optionJson.name).setDescription(optionJson.description);
						if (optionJson.required !== undefined)
							opt.setRequired(optionJson.required);
						if (optionJson.channel_types && optionJson.channel_types.length > 0)
							opt.addChannelTypes(...optionJson.channel_types);
						return opt;
					});
					break;
				case 8: // ROLE
					sc.addRoleOption((opt) => {
						opt.setName(optionJson.name).setDescription(optionJson.description);
						if (optionJson.required !== undefined)
							opt.setRequired(optionJson.required);
						return opt;
					});
					break;
				case 9: // MENTIONABLE
					sc.addMentionableOption((opt) => {
						opt.setName(optionJson.name).setDescription(optionJson.description);
						if (optionJson.required !== undefined)
							opt.setRequired(optionJson.required);
						return opt;
					});
					break;
				case 10: // NUMBER
					sc.addNumberOption((opt) => {
						opt.setName(optionJson.name).setDescription(optionJson.description);
						if (optionJson.required !== undefined)
							opt.setRequired(optionJson.required);
						if (optionJson.choices && optionJson.choices.length > 0)
							opt.addChoices(...optionJson.choices);
						if (optionJson.min_value !== undefined)
							opt.setMinValue(optionJson.min_value);
						if (optionJson.max_value !== undefined)
							opt.setMaxValue(optionJson.max_value);
						if (optionJson.autocomplete !== undefined)
							opt.setAutocomplete(optionJson.autocomplete);
						return opt;
					});
					break;
				case 11: // ATTACHMENT
					sc.addAttachmentOption((opt) => {
						opt.setName(optionJson.name).setDescription(optionJson.description);
						if (optionJson.required !== undefined)
							opt.setRequired(optionJson.required);
						return opt;
					});
					break;
			}
		}
	}
}
