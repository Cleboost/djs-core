import type {
	Client,
	ContextMenuCommandInteraction,
	MessageContextMenuCommandInteraction,
	UserContextMenuCommandInteraction,
} from "discord.js";
import { MessageFlags } from "discord.js";
import type ContextMenu from "../interaction/ContextMenu";

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

		if (!this.client.application) {
			throw new Error("Client application is not available");
		}

		if (this.guilds.length > 0) {
			for (const guildId of this.guilds) {
				await this.client.application.commands.create(contextMenu, guildId);
			}
		} else {
			await this.client.application.commands.create(contextMenu);
		}
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

		if (!this.client.application) {
			throw new Error("Client application is not available");
		}

		if (this.guilds.length > 0) {
			for (const guildId of this.guilds) {
				const commands = await this.client.application.commands.fetch({
					guildId,
				});
				const command = commands.find((cmd) => cmd.name === name);
				if (command) {
					await this.client.application.commands.delete(command.id, guildId);
				}
			}
		} else {
			const commands = await this.client.application.commands.fetch();
			const command = commands.find((cmd) => cmd.name === name);
			if (command) {
				await this.client.application.commands.delete(command.id);
			}
		}
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

	private assertReady(): void {
		if (!this.client.isReady()) {
			throw new Error("Client is not ready");
		}
	}
}
