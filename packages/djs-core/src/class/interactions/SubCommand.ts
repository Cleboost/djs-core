/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBooleanOption,
  SlashCommandChannelOption,
  SlashCommandIntegerOption,
  SlashCommandMentionableOption,
  SlashCommandNumberOption,
  SlashCommandRoleOption,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
  SlashCommandUserOption,
} from "discord.js";
import BotClient from "../BotClient";

type SubCommandRunFn = (
  client: BotClient,
  interaction: ChatInputCommandInteraction,
) => unknown;

type SubCommandAutoCompleteFn = (
  client: BotClient,
  interaction: AutocompleteInteraction,
) => unknown;

export default class SubCommand extends SlashCommandSubcommandBuilder {
  private runFn?: SubCommandRunFn;
  private autoCompleteFn?: SubCommandAutoCompleteFn;
  private parent?: string;

  run(fn: SubCommandRunFn) {
    this.runFn = fn;
    return this;
  }

  autoComplete(fn: SubCommandAutoCompleteFn) {
    this.autoCompleteFn = fn;
    return this;
  }

  execute(client: BotClient, interaction: ChatInputCommandInteraction) {
    if (!this.runFn) {
      client.logger.error(
        new Error("The subcommand has no function to execute"),
      );
      return interaction.reply({
        content: "The subcommand has no function to execute!",
        flags: [MessageFlags.Ephemeral],
      });
    }
    return this.runFn(client, interaction);
  }

  executeAutoComplete(client: BotClient, interaction: AutocompleteInteraction) {
    if (!this.autoCompleteFn) {
      client.logger.error(
        new Error("The subcommand has no function to execute"),
      );
      return interaction.respond([
        {
          name: "The subcommand has no function to execute!",
          value: "The subcommand has no function to execute!",
        },
      ]);
    }
    return this.autoCompleteFn(client, interaction);
  }

  setParent(parent: string) {
    this.parent = parent;
    return this;
  }

  getParent() {
    return this.parent;
  }
}

declare module "discord.js" {
  export interface SlashCommandSubcommandBuilder {
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
