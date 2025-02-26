/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Collection, MessageFlags, AnySelectMenuInteraction } from "discord.js";
import SelectMenu from "../class/interactions/SelectMenu";
import { underline } from "chalk";
import BotClient from "../class/BotClient";
export default class SelectMenuHandler {
  private selectMenus = new Collection<string, SelectMenu>();
  private client: BotClient;

  constructor(client: BotClient) {
    this.client = client;
  }

  addInteraction(selectMenu: SelectMenu) {
    const customId = selectMenu.getCustomId();
    if (!customId) {
      this.client.logger.error(
        new Error(`The select menu ${customId} has no customId`),
      );
      return;
    }
    if (this.selectMenus.has(customId)) {
      this.client.logger.warn(
        `The select menu ${underline(customId)} is already loaded! Skipping...`,
      );
      return;
    }
    this.selectMenus.set(customId, selectMenu);
  }

  removeInteraction(selectMenu: SelectMenu) {
    const customId = selectMenu.getCustomId();
    if (!this.selectMenus.has(customId)) {
      this.client.logger.warn(
        `The select menu ${underline(customId)} is not loaded! Skipping...`,
      );
      return;
    }
    this.selectMenus.delete(customId);
  }

  reloadInteraction(selectMenu: SelectMenu) {
    if (!this.selectMenus.has(selectMenu.getCustomId())) {
      this.client.logger.warn(
        `The select menu ${underline(selectMenu.getCustomId())} is not loaded! Adding instead...`,
      );
      this.addInteraction(selectMenu);
      return;
    }
    this.removeInteraction(selectMenu);
    this.addInteraction(selectMenu);
  }

  async event(interaction: AnySelectMenuInteraction) {
    const selectMenu = this.selectMenus.get(interaction.customId);
    if (!selectMenu)
      return interaction.reply({
        content: "This select menu is not available",
        flags: [MessageFlags.Ephemeral],
      });
    selectMenu.execute(this.client, interaction);
    if (this.client.config?.logger?.logSelect)
      this.client.logger.info(
        `Select menu ${underline(interaction.customId)} used by ${interaction.user.username} (${interaction.user.id})`,
      );
  }
}
