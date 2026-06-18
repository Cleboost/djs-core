import type { AnySelectMenuInteraction } from "discord.js";
import type ChannelSelectMenu from "../interaction/ChannelSelectMenu";
import type MentionableSelectMenu from "../interaction/MentionableSelectMenu";
import type RoleSelectMenu from "../interaction/RoleSelectMenu";
import type StringSelectMenu from "../interaction/StringSelectMenu";
import type UserSelectMenu from "../interaction/UserSelectMenu";
import BaseHandler from "./BaseHandler";

type SelectMenu =
	| StringSelectMenu
	| UserSelectMenu
	| RoleSelectMenu
	| ChannelSelectMenu
	| MentionableSelectMenu;

export default class SelectMenuHandler extends BaseHandler<
	SelectMenu,
	AnySelectMenuInteraction
> {
	public override add(selectMenu: SelectMenu): void {
		if (!selectMenu.baseCustomId) {
			throw new Error(
				"SelectMenu customId is not defined. Use .setCustomId(id) before adding the select menu.",
			);
		}
		super.add(selectMenu);
	}

	public async onSelectMenuInteraction(
		interaction: AnySelectMenuInteraction,
	): Promise<void> {
		await this.dispatch(interaction);
	}
}
