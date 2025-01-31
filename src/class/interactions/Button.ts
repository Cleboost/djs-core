/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { ButtonInteraction } from "discord.js";
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

  execute(client: BotClient, interaction: ButtonInteraction) {
    if (this.runFn) {
      return this.runFn(client, interaction);
    }
    return interaction.reply("No action defined");
  }

  getCustomId() {
    return this.customId;
  }
}
