import type { AnySelectMenuInteraction, Client } from "discord.js";
import { MessageFlags } from "discord.js";
import ChannelSelectMenu from "../interaction/ChannelSelectMenu";
import MentionableSelectMenu from "../interaction/MentionableSelectMenu";
import RoleSelectMenu from "../interaction/RoleSelectMenu";
import StringSelectMenu from "../interaction/StringSelectMenu";
import UserSelectMenu from "../interaction/UserSelectMenu";
import { handleInteractionError } from "../utils/error";

/**
 * Interface representing common properties of all select menu variants.
 */
interface BaseSelectMenu {
	baseCustomId: string;
	execute(interaction: AnySelectMenuInteraction, data: unknown): Promise<void>;
}

type SelectMenu =
	| StringSelectMenu
	| UserSelectMenu
	| RoleSelectMenu
	| ChannelSelectMenu
	| MentionableSelectMenu;

export default class SelectMenuHandler {
	private readonly client: Client;
	private readonly selectMenus: Map<string, SelectMenu> = new Map();

	constructor(client: Client) {
		this.client = client;
	}

	public add(selectMenu: SelectMenu): void {
		// Use type assertion to our common interface
		const menu = selectMenu as unknown as BaseSelectMenu;
		const baseCustomId = menu.baseCustomId;

		if (!baseCustomId) {
			throw new Error(
				"SelectMenu customId is not defined. Use .setCustomId(id) before adding the select menu.",
			);
		}
		this.selectMenus.set(baseCustomId, selectMenu);
	}

	public set(selectMenus: SelectMenu[]): void {
		this.selectMenus.clear();
		for (const selectMenu of selectMenus) {
			this.add(selectMenu);
		}
	}

	public delete(customId: string): void {
		this.selectMenus.delete(customId);
	}

	public async onSelectMenuInteraction(
		interaction: AnySelectMenuInteraction,
	): Promise<void> {
		let decoded: { baseId: string; data: unknown };

		if (interaction.isStringSelectMenu()) {
			decoded = StringSelectMenu.decodeData(interaction.customId);
		} else if (interaction.isUserSelectMenu()) {
			decoded = UserSelectMenu.decodeData(interaction.customId);
		} else if (interaction.isRoleSelectMenu()) {
			decoded = RoleSelectMenu.decodeData(interaction.customId);
		} else if (interaction.isChannelSelectMenu()) {
			decoded = ChannelSelectMenu.decodeData(interaction.customId);
		} else if (interaction.isMentionableSelectMenu()) {
			decoded = MentionableSelectMenu.decodeData(interaction.customId);
		} else {
			return;
		}

		const selectMenu = this.selectMenus.get(decoded.baseId);
		if (!selectMenu) return;

		const hasToken = decoded.baseId !== interaction.customId;

		if (hasToken && decoded.data === undefined) {
			await interaction.reply({
				content: "❌ This interaction has expired or is no longer available.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		try {
			const menu = selectMenu as unknown as BaseSelectMenu;
			await menu.execute(interaction, decoded.data);
		} catch (error) {
			await handleInteractionError(interaction, error);
		}
	}
}
