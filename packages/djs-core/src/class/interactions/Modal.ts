/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import BotClient from "../BotClient";

type ModalRunFn = (
  client: BotClient,
  interaction: ModalSubmitInteraction,
) => unknown;

export default class Modal {
  private runFn?: ModalRunFn;
  private customId?: string;

  setCustomId(customId: string) {
    this.customId = customId;
    return this;
  }

  run(fn: ModalRunFn) {
    this.runFn = fn;
    return this;
  }

  execute(client: BotClient, interaction: ModalSubmitInteraction) {
    if (!this.runFn) {
      client.logger.error(
        new Error(`The modal ${this.customId} has no function to execute
        `),
      );
      return interaction.reply({
        content: `The modal ${this.customId} has no function to execute!`,
        flags: [MessageFlags.Ephemeral],
      });
    }
    return this.runFn(client, interaction);
  }

  getCustomId() {
    return `${this.customId}`;
  }
}
