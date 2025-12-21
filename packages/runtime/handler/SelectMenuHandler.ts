import type {
	Client,
	StringSelectMenuInteraction,
	UserSelectMenuInteraction,
	RoleSelectMenuInteraction,
	ChannelSelectMenuInteraction,
	MentionableSelectMenuInteraction,
} from "discord.js";
import { MessageFlags } from "discord.js";
import type StringSelectMenu from "../interaction/StringSelectMenu";
import type UserSelectMenu from "../interaction/UserSelectMenu";
import type RoleSelectMenu from "../interaction/RoleSelectMenu";
import type ChannelSelectMenu from "../interaction/ChannelSelectMenu";
import type MentionableSelectMenu from "../interaction/MentionableSelectMenu";

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
		const customId = selectMenu.data.custom_id;
		if (!customId) {
			throw new Error(
				"SelectMenu customId is not defined. Use .setCustomId(id) before adding the select menu.",
			);
		}
		this.selectMenus.set(customId, selectMenu);
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
		interaction:
			| StringSelectMenuInteraction
			| UserSelectMenuInteraction
			| RoleSelectMenuInteraction
			| ChannelSelectMenuInteraction
			| MentionableSelectMenuInteraction,
	): Promise<void> {
		const customId = interaction.customId;
		const selectMenu = this.selectMenus.get(customId);
		if (!selectMenu) return;

		try {
			if (interaction.isStringSelectMenu()) {
				await (selectMenu as StringSelectMenu).execute(
					interaction as StringSelectMenuInteraction,
				);
			} else if (interaction.isUserSelectMenu()) {
				await (selectMenu as UserSelectMenu).execute(
					interaction as UserSelectMenuInteraction,
				);
			} else if (interaction.isRoleSelectMenu()) {
				await (selectMenu as RoleSelectMenu).execute(
					interaction as RoleSelectMenuInteraction,
				);
			} else if (interaction.isChannelSelectMenu()) {
				await (selectMenu as ChannelSelectMenu).execute(
					interaction as ChannelSelectMenuInteraction,
				);
			} else if (interaction.isMentionableSelectMenu()) {
				await (selectMenu as MentionableSelectMenu).execute(
					interaction as MentionableSelectMenuInteraction,
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
}
