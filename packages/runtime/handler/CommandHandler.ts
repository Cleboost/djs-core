import type {
	ApplicationCommandDataResolvable,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
} from "discord.js";
import type Command from "../interaction/Command";
import { handleInteractionError } from "../utils/error";
import { runtimeLog } from "../utils/logger";
import { splitRoute } from "../utils/route";

export interface Route {
	route: string;
	command: Command;
}

export default class CommandHandler {
	private readonly client: Client;
	private router: Route[] = [];
	private routerMap = new Map<string, Command>();

	constructor(client: Client) {
		this.client = client;
	}

	public add(route: Route): void {
		const idx = this.router.findIndex((r) => r.route === route.route);
		if (idx >= 0) this.router[idx] = route;
		else this.router.push(route);
		this.enforceNoExecutableRootWhenHasChildren();
		this.rebuildRouterMap();
	}

	public set(router: Route[]): void {
		this.router = router;
		this.enforceNoExecutableRootWhenHasChildren();
		this.rebuildRouterMap();
	}

	public getRoutes(): Route[] {
		return this.router;
	}

	public delete(routeKey: string): void {
		this.router = this.router.filter((r) => r.route !== routeKey);
		this.routerMap.delete(routeKey);
	}

	public async onCommandInteraction(
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		const key = this.buildRouteKey(interaction);
		const command = this.routerMap.get(key);
		if (!command) {
			runtimeLog.error(`Command not found for route: ${key}`);
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
			runtimeLog.error("Autocomplete handler failed", e);
		}
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

	private rebuildRouterMap(): void {
		this.routerMap.clear();
		for (const r of this.router) this.routerMap.set(r.route, r.command);
	}
}
