/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import {
  Collection,
  ContextMenuCommandInteraction,
  MessageFlags,
} from "discord.js";
import { underline } from "chalk";
import BotClient from "../class/BotClient";
import { pushToApi } from "./loader";
import ContextMenu from "../class/interactions/ContextMenu";

export default class ContetxtMenuHandler {
  private client: BotClient;
  private contextMenus: Collection<string, ContextMenu> = new Collection();

  constructor(client: BotClient) {
    this.client = client;
  }

  addInteraction(command: ContextMenu) {
    if (this.contextMenus.has(command.name)) {
      this.client.logger.warn(
        `The command ${underline(command.name)} is already loaded! Skipping...`,
      );
      return;
    }
    this.contextMenus.set(command.name, command);
    return;
  }

  removeInteraction(command: ContextMenu) {
    if (!this.contextMenus.has(command.name)) {
      this.client.logger.warn(
        `The command ${underline(command.name)} is not loaded! Skipping...`,
      );
      return;
    }
    this.contextMenus.delete(command.name);
    return;
  }

  reloadInteraction(command: ContextMenu) {
    const existingCommand = this.contextMenus.find(
      (cmd) => cmd.name === command.name,
    );

    if (!existingCommand) {
      this.client.logger.warn(
        `The command ${underline(command.name)} is not loaded! Adding instead...`,
      );
      this.addInteraction(command);
      pushToApi(this.client);
      this.client.logger.info(
        `Command ${underline(command.name)} added successfully, and pushed to API. You may reload your Discord client to see the changes.`,
      );
      return;
    }

    if (existingCommand.name !== command.name) {
      this.client.logger.info(
        `Command name changed: ${underline(existingCommand.name)} -> ${underline(command.name)}`,
      );
    }

    this.removeInteraction(existingCommand);
    this.addInteraction(command);
    return;
  }

  async eventContextMenu(interaction: ContextMenuCommandInteraction) {
    const cmd = this.contextMenus.get(interaction.commandName);
    if (!cmd) return;
    cmd.execute(this.client, interaction);

    if (this.client.config?.logger?.logCmd)
      this.client.logger.info(
        `ContextMenu ${underline(interaction.commandName)} used  by ${interaction.user.username} (${interaction.user.id})`,
      );

    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (interaction.deferred || interaction.replied) return;

    await interaction.reply({
      content:
        "ContextMenu took too long to respond or an error occurred during execution (please report this to the bot developer)",
      flags: [MessageFlags.Ephemeral],
    });
    return;
  }

  listCommands(): ContextMenu[] {
    return Array.from(this.contextMenus.values());
  }
}
