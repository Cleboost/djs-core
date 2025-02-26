/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import Command from "../class/interactions/Command";
import {
  ChatInputCommandInteraction,
  Collection,
  MessageFlags,
} from "discord.js";
import { underline } from "chalk";
import BotClient from "../class/BotClient";
import { pushToApi } from "./loader";

export default class CommandHandler {
  private client: BotClient;
  private commands: Collection<string, Command> = new Collection();
  constructor(client: BotClient) {
    this.client = client;
  }
  async addInteraction(command: Command) {
    if (this.commands.has(command.name)) {
      this.client.logger.warn(
        `The command ${underline(command.name)} is already loaded! Skipping...`,
      );
      return;
    }
    return this.commands.set(command.name, command);
  }

  async removeInteraction(command: Command) {
    if (!this.commands.has(command.name)) {
      this.client.logger.warn(
        `The command ${underline(command.name)} is not loaded! Skipping...`,
      );
      return;
    }
    return this.commands.delete(command.name);
  }

  async reloadInteraction(command: Command) {
    const existingCommand = this.commands.find(
      (cmd) => cmd.name === command.name,
    );

    if (!existingCommand) {
      this.client.logger.warn(
        `The command ${underline(command.name)} is not loaded! Adding instead...`,
      );
      this.addInteraction(command);
      pushToApi(this.client);
      return this.client.logger.info(
        `Command ${underline(command.name)} added successfully, and pushed to API. You may reload your Discord client to see the changes.`,
      );
    }

    if (existingCommand.name !== command.name) {
      this.client.logger.info(
        `Command name changed: ${underline(existingCommand.name)} -> ${underline(command.name)}`,
      );
    }

    await this.removeInteraction(existingCommand);
    return this.addInteraction(command);
  }

  async eventCommand(interaction: ChatInputCommandInteraction) {
    const cmd = this.commands.get(interaction.commandName);
    if (!cmd) return;
    cmd.execute(this.client, interaction);

    if (this.client.config?.logger?.logCmd)
      this.client.logger.info(
        `Command ${underline(interaction.commandName)} used  by ${interaction.user.username} (${interaction.user.id})`,
      );

    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (interaction.deferred || interaction.replied) return;

    this.client.logger.warn(
      `Command (${interaction.commandName}.${interaction.options.getSubcommand()}) took too long to respond, use deferred or reply method within 2 seconds. It could also be an error during execution causing the command to crash and not respond.`,
    );
    return interaction.reply({
      content:
        "Command took too long to respond or an error occurred during execution (please report this to the bot developer)",
      flags: [MessageFlags.Ephemeral],
    });
  }

  async eventAutocomplete() {}

  listCommands(): Command[] {
    return Array.from(this.commands.values());
  }
}
