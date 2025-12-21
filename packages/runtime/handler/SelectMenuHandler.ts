import type {
	ChannelSelectMenuInteraction,
	Client,
	MentionableSelectMenuInteraction,
	RoleSelectMenuInteraction,
	StringSelectMenuInteraction,
	UserSelectMenuInteraction,
} from "discord.js";
import { MessageFlags } from "discord.js";
import ChannelSelectMenu from "../interaction/ChannelSelectMenu";
import MentionableSelectMenu from "../interaction/MentionableSelectMenu";
import RoleSelectMenu from "../interaction/RoleSelectMenu";
import StringSelectMenu from "../interaction/StringSelectMenu";
import UserSelectMenu from "../interaction/UserSelectMenu";

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
		let baseCustomId: string | undefined;
		if (selectMenu instanceof StringSelectMenu) {
			baseCustomId = selectMenu.baseCustomId;
		} else if (selectMenu instanceof UserSelectMenu) {
			baseCustomId = selectMenu.baseCustomId;
		} else if (selectMenu instanceof RoleSelectMenu) {
			baseCustomId = selectMenu.baseCustomId;
		} else if (selectMenu instanceof ChannelSelectMenu) {
			baseCustomId = selectMenu.baseCustomId;
		} else if (selectMenu instanceof MentionableSelectMenu) {
			baseCustomId = selectMenu.baseCustomId;
		} else {
			baseCustomId = selectMenu.data.custom_id;
		}
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
		interaction:
			| StringSelectMenuInteraction
			| UserSelectMenuInteraction
			| RoleSelectMenuInteraction
			| ChannelSelectMenuInteraction
			| MentionableSelectMenuInteraction,
	): Promise<void> {
		let decoded: { baseId: string; data: unknown };
		let selectMenu: SelectMenu | undefined;

		if (interaction.isStringSelectMenu()) {
			decoded = StringSelectMenu.decodeData(interaction.customId);
			selectMenu = this.selectMenus.get(decoded.baseId);
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
				await (selectMenu as StringSelectMenu).execute(
					interaction as StringSelectMenuInteraction,
					decoded.data,
				);
			} catch (e) {
				console.error(e);
				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
						content: "An error occurred.",
						flags: MessageFlags.Ephemeral,
					});
				}
			}
		} else if (interaction.isUserSelectMenu()) {
			decoded = UserSelectMenu.decodeData(interaction.customId);
			selectMenu = this.selectMenus.get(decoded.baseId);
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
				await (selectMenu as UserSelectMenu).execute(
					interaction as UserSelectMenuInteraction,
					decoded.data,
				);
			} catch (e) {
				console.error(e);
				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
						content: "An error occurred.",
						flags: MessageFlags.Ephemeral,
					});
				}
			}
		} else if (interaction.isRoleSelectMenu()) {
			decoded = RoleSelectMenu.decodeData(interaction.customId);
			selectMenu = this.selectMenus.get(decoded.baseId);
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
				await (selectMenu as RoleSelectMenu).execute(
					interaction as RoleSelectMenuInteraction,
					decoded.data,
				);
			} catch (e) {
				console.error(e);
				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
						content: "An error occurred.",
						flags: MessageFlags.Ephemeral,
					});
				}
			}
		} else if (interaction.isChannelSelectMenu()) {
			decoded = ChannelSelectMenu.decodeData(interaction.customId);
			selectMenu = this.selectMenus.get(decoded.baseId);
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
				await (selectMenu as ChannelSelectMenu).execute(
					interaction as ChannelSelectMenuInteraction,
					decoded.data,
				);
			} catch (e) {
				console.error(e);
				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
						content: "An error occurred.",
						flags: MessageFlags.Ephemeral,
					});
				}
			}
		} else if (interaction.isMentionableSelectMenu()) {
			decoded = MentionableSelectMenu.decodeData(interaction.customId);
			selectMenu = this.selectMenus.get(decoded.baseId);
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
				await (selectMenu as MentionableSelectMenu).execute(
					interaction as MentionableSelectMenuInteraction,
					decoded.data,
				);
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
}
