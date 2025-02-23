/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  MessageFlags,
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

export default class SubCommand {
  private runFn?: SubCommandRunFn;
  private autoCompleteFn?: SubCommandAutoCompleteFn;

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
      client.logger.error("The subcommand has no function to execute!");
      return interaction.reply({
        content: "The subcommand has no function to execute!",
        flags: [MessageFlags.Ephemeral],
      });
    }
    return this.runFn(client, interaction);
  }

  executeAutoComplete(client: BotClient, interaction: AutocompleteInteraction) {
    if (!this.autoCompleteFn) {
      client.logger.error("The subcommand has no function to execute!");
      return interaction.respond([
        {
          name: "The subcommand has no function to execute!",
          value: "The subcommand has no function to execute!",
        },
      ]);
    }
    return this.autoCompleteFn(client, interaction);
  }
}
