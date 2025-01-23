/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { ModalSubmitInteraction } from "discord.js";
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
    if (this.runFn) {
      return this.runFn(client, interaction);
    }
    return interaction.reply("Aucune action définie");
  }

  getCustomId() {
    return `${this.customId}`;
  }
}
