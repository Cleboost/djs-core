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

  addInteraction(command: Command) {
    if (this.commands.has(command.name)) {
      this.client.logger.warn(
        `The command ${underline(command.name)} is already loaded! Skipping...`,
      );
      return;
    }
    this.commands.set(command.name, command);
    return;
  }

  removeInteraction(command: Command) {
    if (!this.commands.has(command.name)) {
      this.client.logger.warn(
        `The command ${underline(command.name)} is not loaded! Skipping...`,
      );
      return;
    }
    this.commands.delete(command.name);
    return;
  }

  reloadInteraction(command: Command) {
    const existingCommand = this.commands.find(
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
    await interaction.reply({
      content:
        "Command took too long to respond or an error occurred during execution (please report this to the bot developer)",
      flags: [MessageFlags.Ephemeral],
    });
    return;
  }

  async eventAutocomplete() {}

  listCommands(): Command[] {
    return Array.from(this.commands.values());
  }
}
