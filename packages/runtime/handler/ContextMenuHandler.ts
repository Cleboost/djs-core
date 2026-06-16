import type {
	Client,
	ContextMenuCommandInteraction,
	MessageContextMenuCommandInteraction,
	UserContextMenuCommandInteraction,
} from "discord.js";
import type ContextMenu from "../interaction/ContextMenu";
import { handleInteractionError } from "../utils/error";

export default class ContextMenuHandler {
	private readonly client: Client;
	private readonly contextMenus: Map<string, ContextMenu> = new Map();
	private guilds: string[] = [];

	constructor(client: Client) {
		this.client = client;
	}

	public setGuilds(guilds: string[]): void {
		this.guilds = guilds;
	}

	public async add(contextMenu: ContextMenu): Promise<void> {
		this.assertReady();
		this.contextMenus.set(contextMenu.name, contextMenu);

		const application = this.client.application;
		if (!application) throw new Error("Client application is not available");

		await this.forEachScope((guildId) =>
			guildId
				? application.commands.create(contextMenu, guildId)
				: application.commands.create(contextMenu),
		);
	}

	public set(contextMenus: ContextMenu[]): void {
		this.contextMenus.clear();
		for (const contextMenu of contextMenus) {
			this.contextMenus.set(contextMenu.name, contextMenu);
		}
	}

	public getContextMenus(): ContextMenu[] {
		return Array.from(this.contextMenus.values());
	}

	public async delete(name: string): Promise<void> {
		this.assertReady();
		const contextMenu = this.contextMenus.get(name);
		if (!contextMenu) return;

		this.contextMenus.delete(name);

		const application = this.client.application;
		if (!application) throw new Error("Client application is not available");

		await this.forEachScope(async (guildId) => {
			const commands = guildId
				? await application.commands.fetch({ guildId })
				: await application.commands.fetch();
			const command = commands.find((cmd) => cmd.name === name);
			if (command) {
				await application.commands.delete(command.id, guildId ?? undefined);
			}
		});
	}

	public async onContextMenuInteraction(
		interaction: ContextMenuCommandInteraction,
	): Promise<void> {
		const contextMenu = this.contextMenus.get(interaction.commandName);
		if (!contextMenu) return;

		try {
			if (interaction.isUserContextMenuCommand()) {
				await contextMenu.execute(
					interaction as UserContextMenuCommandInteraction,
				);
			} else if (interaction.isMessageContextMenuCommand()) {
				await contextMenu.execute(
					interaction as MessageContextMenuCommandInteraction,
				);
			}
		} catch (error) {
			await handleInteractionError(interaction, error);
		}
	}

	private async forEachScope(
		fn: (guildId: string | null) => Promise<unknown>,
	): Promise<void> {
		if (this.guilds.length > 0) {
			await Promise.all(this.guilds.map((id) => fn(id)));
		} else {
			await fn(null);
		}
	}

	private assertReady(): void {
		if (!this.client.isReady()) {
			throw new Error("Client is not ready");
		}
	}
}
