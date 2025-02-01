/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import BotClient from "../BotClient";

type SubCommandRunFn = (
  client: BotClient,
  interaction: ChatInputCommandInteraction,
) => unknown;

export default class SubCommand {
  private runFn?: SubCommandRunFn;

  run(fn: SubCommandRunFn) {
    this.runFn = fn;
    return this;
  }

  execute(client: BotClient, interaction: ChatInputCommandInteraction) {
    if (!this.runFn) {
      client.logger.error("The subcommand has no function to execute!");
      return interaction.reply({
        content: "The subcommand has no function to execute!",
        flags: [MessageFlags.Ephemeral]
      });
    }
    return this.runFn(client, interaction);
  }
}
