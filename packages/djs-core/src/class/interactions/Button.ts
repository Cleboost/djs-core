/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { ButtonInteraction, MessageFlags } from "discord.js";
import BotClient from "../BotClient";

type ButtonRunFn = (
  client: BotClient,
  interaction: ButtonInteraction,
) => unknown;

export default class Button {
  private runFn?: ButtonRunFn;
  private customId?: string;

  setCustomId(customId: string) {
    this.customId = customId;
    return this;
  }

  run(fn: ButtonRunFn) {
    this.runFn = fn;
    return this;
  }

  async execute(client: BotClient, interaction: ButtonInteraction) {
    if (!this.runFn) {
      client.logger.error(
        new Error(`The button ${this.customId} has no function to execute
        `),
      );
      return interaction.reply({
        content: `The button ${this.customId} has no function to execute!`,
        flags: [MessageFlags.Ephemeral],
      });
    }
    return this.runFn(client, interaction);
  }

  getCustomId() {
    return this.customId;
  }
}
