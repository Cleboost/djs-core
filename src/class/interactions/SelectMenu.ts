/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { AnySelectMenuInteraction, MessageFlags } from "discord.js";
import BotClient from "../BotClient";

type SelectRunFn = (
  client: BotClient,
  interaction: AnySelectMenuInteraction,
) => unknown;

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
    if (!this.runFn) {
      client.logger.error(
        `The select menu ${this.customId} has no function to execute!`,
      );
      return interaction.reply({
        content: `The select menu ${this.customId} has no function to execute!`,
        flags: [MessageFlags.Ephemeral]
      });
    }
    return this.runFn(client, interaction);
  }

  getCustomId() {
    return `string:${this.customId}`;
  }
}
