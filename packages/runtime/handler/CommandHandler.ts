import type {
	ApplicationCommand,
	ApplicationCommandDataResolvable,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	Collection,
} from "discord.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type Command from "../interaction/Command";

export interface Route {
	route: string;
	command: Command;
}

export default class CommandHandler {
	private readonly client: Client;
	private router: Route[] = [];
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

		this.enforceNoExecutableRootWhenHasChildren();

		if (!skipSync) {
			const root = this.getRoot(route.route);
			await this.upsertRootEverywhere(root);
		}
	}

	public set(router: Route[]): void {
		this.router = router;
		this.enforceNoExecutableRootWhenHasChildren();
	}

	public getRoutes(): Route[] {
		return this.router;
	}

	public async delete(routeKey: string, skipSync = false): Promise<void> {
		this.assertReady();

		this.router = this.router.filter((r) => r.route !== routeKey);
		
		if (!skipSync) {
			const root = this.getRoot(routeKey);
			await this.upsertRootEverywhere(root);
		}
	}

	public async onCommandInteraction(
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		const key = this.buildRouteKey(interaction);
		const route = this.router.find((r) => r.route === key);
		if (!route) return;

		try {
			await route.command.execute(interaction);
		} catch (e) {
			console.error(e);
			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({
					content: "An error occurred.",
					flags: MessageFlags.Ephemeral,
				});
			}
		}
	}

	public async onAutocompleteInteraction(
		interaction: AutocompleteInteraction,
	): Promise<void> {
		const key = this.buildAutocompleteRouteKey(interaction);
		const route = this.router.find((r) => r.route === key);
		if (!route) return;

		try {
			await route.command.executeAutocomplete(interaction);
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
		const roots = new Set(this.router.map((r) => this.getRoot(r.route)));
		const payload: ApplicationCommandDataResolvable[] = [];

		for (const root of roots) {
			const compiled = this.compileRoot(root);
			if (compiled) payload.push(compiled);
		}

		return payload;
	}

	private compileRoot(root: string): ApplicationCommandDataResolvable | null {
		const routes = this.router
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
			const cmdWithDesc = cmd as SlashCommandBuilder & { description?: string };
			builder.setDescription(cmdWithDesc.description ?? "No description");
			return builder.toJSON();
		}

		for (const [name, cmd] of subcommands) {
			if (name === "__root__") continue;
			builder.addSubcommand((sc) => {
				sc.setName(name);
				const cmdWithDesc = cmd as SlashCommandBuilder & {
					description?: string;
				};
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
						const cmdWithDesc = cmd as SlashCommandBuilder & {
							description?: string;
						};
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
			const parts = this.splitRoute(r.route);
			if (parts.length >= 2) {
				const root = parts[0];
				if (root) {
					rootsWithChildren.add(root);
				}
			}
		}

		if (rootsWithChildren.size === 0) return;

		this.router = this.router.filter((r) => {
			const parts = this.splitRoute(r.route);
			if (parts.length === 1) {
				const root = parts[0];
				return !root || !rootsWithChildren.has(root);
			}
			return true;
		});
	}

	private buildRouteKey(interaction: ChatInputCommandInteraction): string {
		const root = interaction.commandName;
		const group = interaction.options.getSubcommandGroup(false);
		const sub = interaction.options.getSubcommand(false);

		if (group && sub) return `${root}.${group}.${sub}`;
		if (sub) return `${root}.${sub}`;
		return root;
	}

	private buildAutocompleteRouteKey(interaction: AutocompleteInteraction): string {
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

	private assertReady(): void {
		if (!this.client.application) {
			throw new Error("client.application is not ready");
		}
	}
}
