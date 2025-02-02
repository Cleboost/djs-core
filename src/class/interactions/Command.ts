/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import {
  CommandInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandUserOption,
  MessageFlags,
  SlashCommandStringOption,
  SlashCommandIntegerOption,
  SlashCommandBooleanOption,
  SlashCommandNumberOption,
  SlashCommandChannelOption,
  SlashCommandRoleOption,
  SlashCommandMentionableOption,
} from "discord.js";
import BotClient from "../BotClient";

type CommandRunFn = (
  client: BotClient,
  interaction: ChatInputCommandInteraction,
) => unknown;
type CommandRunAutoCompleteFn = (
  client: BotClient,
  interaction: ChatInputCommandInteraction,
) => unknown;

export default class Command extends SlashCommandBuilder {
  private runFn?: CommandRunFn;
  private autocomplete?: CommandRunAutoCompleteFn;

  constructor() {
    super();
  }

  run(fn: CommandRunFn) {
    this.runFn = fn;
    return this;
  }

  autoComplete(fn: CommandRunAutoCompleteFn) {
    this.autocomplete = fn;
    return this;
  }

  /**
   * @private
   * DO NOT USE
   * Internal method to execute the function
   */
  execute(client: BotClient, interaction: ChatInputCommandInteraction) {
    if (!this.runFn) {
      client.logger.error(
        `The command ${this.name} has no function to execute!`,
      );
      return interaction.reply({
        content: `The command ${this.name} has no function to execute!`,
        flags: [MessageFlags.Ephemeral],
      });
    }
    return this.runFn(client, interaction);
  }

  /**
   * @private
   * DO NOT USE
   * Internal method to execute the function
   */
  executeAutoComplete(client: BotClient, interaction: CommandInteraction) {
    if (
      this.autocomplete &&
      interaction instanceof ChatInputCommandInteraction
    ) {
      return this.autocomplete(client, interaction);
    }
    if (interaction instanceof CommandInteraction) {
      return interaction.reply("Aucune action définie");
    }
  }

  getDiscordCommand() {
    return this.toJSON();
  }
}

// Fix types for SlashCommandBuilder to allow for custom options
declare module "discord.js" {
  export interface SlashCommandBuilder {
    addUserOption(
      input:
        | SlashCommandUserOption
        | ((builder: SlashCommandUserOption) => SlashCommandUserOption),
    ): this;

    addStringOption(
      input:
        | SlashCommandStringOption
        | ((builder: SlashCommandStringOption) => SlashCommandStringOption),
    ): this;

    addIntegerOption(
      input:
        | SlashCommandIntegerOption
        | ((builder: SlashCommandIntegerOption) => SlashCommandIntegerOption),
    ): this;

    addBooleanOption(
      input:
        | SlashCommandBooleanOption
        | ((builder: SlashCommandBooleanOption) => SlashCommandBooleanOption),
    ): this;

    addNumberOption(
      input:
        | SlashCommandNumberOption
        | ((builder: SlashCommandNumberOption) => SlashCommandNumberOption),
    ): this;

    addChannelOption(
      input:
        | SlashCommandChannelOption
        | ((builder: SlashCommandChannelOption) => SlashCommandChannelOption),
    ): this;

    addRoleOption(
      input:
        | SlashCommandRoleOption
        | ((builder: SlashCommandRoleOption) => SlashCommandRoleOption),
    ): this;

    addMentionableOption(
      input:
        | SlashCommandMentionableOption
        | ((
            builder: SlashCommandMentionableOption,
          ) => SlashCommandMentionableOption),
    ): this;
  }
}
