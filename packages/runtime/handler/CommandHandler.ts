import type {
	ApplicationCommand,
	ApplicationCommandDataResolvable,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	Collection,
} from "discord.js";
import { SlashCommandBuilder } from "discord.js";
import type Command from "../interaction/Command";
import { handleInteractionError } from "../utils/error";
import { getRoot, splitRoute } from "../utils/route";
import { buildCommandStructure, routesToEntries } from "../utils/compile-command";

export interface Route {
	route: string;
	command: Command;
}

export default class CommandHandler {
	private readonly client: Client;
	private router: Route[] = [];
	private routerMap = new Map<string, Command>();
	private guilds: string[] = [];
	private rootIdCache = new Map<string, Map<string, string>>();

	constructor(client: Client) {
		this.client = client;
	}

	public setGuilds(guilds: string[]): void {
		this.guilds = guilds;
	}

	public async add(route: Route, skipSync = false): Promise<void> {
		this.assertReady();

		const idx = this.router.findIndex((r) => r.route === route.route);
		if (idx >= 0) this.router[idx] = route;
		else this.router.push(route);
		this.routerMap.set(route.route, route.command);

		this.enforceNoExecutableRootWhenHasChildren();

		if (!skipSync) {
			const root = getRoot(route.route);
			await this.upsertRootEverywhere(root);
		}
	}

	public set(router: Route[]): void {
		this.router = router;
		this.enforceNoExecutableRootWhenHasChildren();
		this.routerMap.clear();
		for (const r of this.router) this.routerMap.set(r.route, r.command);
	}

	public getRoutes(): Route[] {
		return this.router;
	}

	public async delete(routeKey: string, skipSync = false): Promise<void> {
		this.assertReady();

		this.router = this.router.filter((r) => r.route !== routeKey);
		this.routerMap.delete(routeKey);

		if (!skipSync) {
			const root = getRoot(routeKey);
			await this.upsertRootEverywhere(root);
		}
	}

	public async onCommandInteraction(
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		const key = this.buildRouteKey(interaction);
		const command = this.routerMap.get(key);
		if (!command) {
			console.error(`Command not found for route: ${key}`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			await handleInteractionError(interaction, error);
		}
	}

	public async onAutocompleteInteraction(
		interaction: AutocompleteInteraction,
	): Promise<void> {
		const key = this.buildRouteKey(interaction);
		const command = this.routerMap.get(key);
		if (!command) return;

		try {
			await command.executeAutocomplete(interaction);
		} catch (e) {
			console.error(e);
		}
	}

	private async upsertRootEverywhere(root: string): Promise<void> {
		if (this.guilds.length > 0) {
			for (const guildId of this.guilds) {
				await this.ensureCache(guildId);
				await this.upsertOrDeleteRoot(root, guildId);
			}
		} else {
			await this.ensureCache("global");
			await this.upsertOrDeleteRoot(root, "global");
		}
	}

	private async upsertOrDeleteRoot(root: string, scope: string): Promise<void> {
		if (!this.client.application) {
			throw new Error("Client application is not available");
		}

		const compiled = this.compileRoot(root);
		const cache = this.rootIdCache.get(scope);
		if (!cache) {
			throw new Error(`Cache for scope '${scope}' is not available`);
		}
		const existingId = cache.get(root);

		if (!compiled) {
			if (existingId) {
				try {
					await this.client.application.commands.delete(
						existingId,
						scope === "global" ? undefined : scope,
					);
				} catch (error: unknown) {
					if (
						error &&
						typeof error === "object" &&
						"code" in error &&
						error.code === 10063
					) {
					} else {
						throw error;
					}
				}
				cache.delete(root);
			}
			return;
		}

		if (existingId) {
			try {
				if (scope === "global") {
					const edited = await this.client.application.commands.edit(
						existingId,
						compiled,
					);
					cache.set(edited.name, edited.id);
				} else {
					const edited = await this.client.application.commands.edit(
						existingId,
						compiled,
						scope,
					);
					cache.set(edited.name, edited.id);
				}
			} catch (error: unknown) {
				if (
					error &&
					typeof error === "object" &&
					"code" in error &&
					error.code === 10063
				) {
					cache.delete(root);
					const created = await this.client.application.commands.create(
						compiled,
						scope === "global" ? undefined : scope,
					);
					cache.set(created.name, created.id);
				} else {
					throw error;
				}
			}
		} else {
			const created = await this.client.application.commands.create(
				compiled,
				scope === "global" ? undefined : scope,
			);
			cache.set(created.name, created.id);
		}
	}

	private async ensureCache(scope: string): Promise<void> {
		if (this.rootIdCache.has(scope)) return;

		if (!this.client.application) {
			throw new Error("Client application is not available");
		}

		try {
			const fetched = await this.client.application.commands.fetch(
				scope === "global" ? undefined : scope,
			);

			const map = new Map<string, string>();
			for (const cmd of fetched.values()) {
				map.set(cmd.name, cmd.id);
			}
			this.rootIdCache.set(scope, map);
		} catch (error: unknown) {
			if (
				error &&
				typeof error === "object" &&
				"code" in error &&
				error.code === 10063
			) {
				const map = new Map<string, string>();
				this.rootIdCache.set(scope, map);
				return;
			}
			throw error;
		}
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

	private compileAllRoots(): ApplicationCommandDataResolvable[] {
		const roots = new Set(this.router.map((r) => getRoot(r.route)));
		const payload: ApplicationCommandDataResolvable[] = [];

		for (const root of roots) {
			const compiled = this.compileRoot(root);
			if (compiled) payload.push(compiled);
		}

		return payload;
	}

	private compileRoot(root: string): ApplicationCommandDataResolvable | null {
		const entries = routesToEntries(this.router, root);
		if (entries.length === 0) return null;

		const { subcommands, groups, builder } = buildCommandStructure(
			root,
			entries,
			(r) => this.getRootDescription(r),
		);

		if (subcommands.has("__root__") && subcommands.size === 1 && groups.size === 0) {
			const cmd = subcommands.get("__root__")!;
			const cmdWithDesc = cmd as SlashCommandBuilder & { description?: string };
			builder.setDescription(cmdWithDesc.description ?? "No description");
			return builder.toJSON();
		}

		for (const [name, cmd] of subcommands) {
			if (name === "__root__") continue;
			builder.addSubcommand((sc) => {
				sc.setName(name);
				const cmdWithDesc = cmd as SlashCommandBuilder & { description?: string };
				sc.setDescription(cmdWithDesc.description ?? "No description");
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
						const cmdWithDesc = cmd as SlashCommandBuilder & { description?: string };
						sc.setDescription(cmdWithDesc.description ?? "No description");
						return sc;
					});
				}
				return g;
			});
		}

		return builder.toJSON();
	}

	private enforceNoExecutableRootWhenHasChildren(): void {
		const rootsWithChildren = new Set<string>();

		for (const r of this.router) {
			const parts = splitRoute(r.route);
			if (parts.length >= 2) {
				const root = parts[0];
				if (root) {
					rootsWithChildren.add(root);
				}
			}
		}

		if (rootsWithChildren.size === 0) return;

		this.router = this.router.filter((r) => {
			const parts = splitRoute(r.route);
			if (parts.length === 1) {
				const root = parts[0];
				return !root || !rootsWithChildren.has(root);
			}
			return true;
		});
	}

	private buildRouteKey(
		interaction: ChatInputCommandInteraction | AutocompleteInteraction,
	): string {
		const root = interaction.commandName;
		const group = interaction.options.getSubcommandGroup(false);
		const sub = interaction.options.getSubcommand(false);
		if (group && sub) return `${root}.${group}.${sub}`;
		if (sub) return `${root}.${sub}`;
		return root;
	}

	private getRootDescription(root: string): string | undefined {
		const leaf = this.router.find((r) => r.route === root);
		if (!leaf) return undefined;
		const cmd = leaf.command as SlashCommandBuilder & { description?: string };
		return cmd.description;
	}

	private assertReady(): void {
		if (!this.client.application) {
			throw new Error("client.application is not ready");
		}
	}
}
