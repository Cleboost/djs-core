import { type ChatInputCommandInteraction, type Client, SlashCommandBuilder } from "discord.js";

export type CommandRunFn = (
  client: Client,
  interaction: ChatInputCommandInteraction
) => Promise<void> | void;

/**
 * Builder of slash-command based on `SlashCommandBuilder` from discord.js.
 * Simply adds the `run` method to define the business logic.
 */
export class Command extends SlashCommandBuilder {
  private _run?: CommandRunFn;

  /**
   * Declare the function executed when the command is called.
   */
  run(fn: CommandRunFn): this {
    this._run = fn;
    return this;
  }

  /** Optional hook to execute code at registration (ex. autocompletion). */
  register?(client: Client): Promise<void> | void;

  /**
   * Method consumed by the handler at runtime.
   */
  async execute(interaction: ChatInputCommandInteraction) {
    if (!this._run) throw new Error(`The command ${this.name} has no .run() callback defined`);
    await this._run(interaction.client as Client, interaction);
  }
} 