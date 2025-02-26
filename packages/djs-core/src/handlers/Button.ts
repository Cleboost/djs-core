/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Collection, MessageFlags, ButtonInteraction } from "discord.js";
import Button from "../class/interactions/Button";
import { underline } from "chalk";
import BotClient from "../class/BotClient";
export default class ButtonHandler {
  private buttons = new Collection<string, Button>();
  private client: BotClient;

  constructor(client: BotClient) {
    this.client = client;
  }

  addInteraction(button: Button) {
    const customId = button.getCustomId();
    if (this.buttons.has(customId)) {
      this.client.logger.warn(
        `The button ${underline(customId)} is already loaded! Skipping...`,
      );
      return;
    }
    this.buttons.set(customId, button);
  }

  removeInteraction(button: Button) {
    const customId = button.getCustomId();
    if (!this.buttons.has(customId)) {
      this.client.logger.warn(
        `The button ${underline(customId)} is not loaded! Skipping...`,
      );
      return;
    }
    this.buttons.delete(customId);
  }

  reloadInteraction(button: Button) {
    if (!this.buttons.has(button.getCustomId())) {
      this.client.logger.warn(
        `The button ${underline(button.getCustomId())} is not loaded! Adding instead...`,
      );
      this.addInteraction(button);
      return;
    }
    this.removeInteraction(button);
    this.addInteraction(button);
  }

  async event(interaction: ButtonInteraction) {
    const button = this.buttons.get(interaction.customId);
    if (!button)
      return interaction.reply({
        content: "This button is not available",
        flags: [MessageFlags.Ephemeral],
      });
    button.execute(this.client, interaction);
    if (this.client.config?.logger?.logBtn)
      this.client.logger.info(
        `Button ${underline(interaction.customId)} used by ${interaction.user.username} (${interaction.user.id})`,
      );
  }
}
