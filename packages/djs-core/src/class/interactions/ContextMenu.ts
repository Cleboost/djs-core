import {
  ContextMenuCommandBuilder,
  ContextMenuCommandInteraction,
  MessageFlags,
} from "discord.js";
import BotClient from "../BotClient";

type ContextRunFn = (
  client: BotClient,
  interaction: ContextMenuCommandInteraction,
) => unknown;
export default class ContextMenu extends ContextMenuCommandBuilder {
  private runFn?: ContextRunFn;
  constructor() {
    super();
  }

  run(fn: ContextRunFn) {
    this.runFn = fn;
    return this;
  }

  /**
   * @private
   * DO NOT USE
   * Internal method to execute the function
   */
  execute(client: BotClient, interaction: ContextMenuCommandInteraction) {
    if (!this.runFn) {
      client.logger.error(
        new Error(`The command ${this.name} has no function to execute`),
      );
      return interaction.reply({
        content: `The command ${this.name} has no function to execute!`,
        flags: [MessageFlags.Ephemeral],
      });
    }
    return this.runFn(client, interaction);
  }

  getDiscordCommand() {
    return this.toJSON();
  }
}
