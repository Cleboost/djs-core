/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { AnySelectMenuInteraction } from "discord.js";
import BotClient from "../BotClient";

type SelectRunFn = (client: BotClient, interaction: AnySelectMenuInteraction) => unknown;

export default class SelectMenu {
	private runFn?: SelectRunFn;
	private customId?: string;

	setCustomId(customId: string) {
		this.customId = customId;
		return this;
	}

	run(fn: SelectRunFn) {
		this.runFn = fn;
		return this;
	}

	execute(client: BotClient, interaction: AnySelectMenuInteraction) {
		if (this.runFn) {
			return this.runFn(client, interaction);
		}
		return interaction.reply("Aucune action définie");
	}

	getCustomId() {
		return `string:${this.customId}`;
	}
}
