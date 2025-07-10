import { type ChatInputCommandInteraction, type Client, SlashCommandBuilder } from "discord.js";

export type CommandRunFn = (
  client: Client,
  interaction: ChatInputCommandInteraction
) => Promise<void> | void;

export class Command extends SlashCommandBuilder {
  private _run?: CommandRunFn;

  run(fn: CommandRunFn): this {
    this._run = fn;
    return this;
  }

  register?(client: Client): Promise<void> | void;

  async execute(interaction: ChatInputCommandInteraction) {
    if (!this._run) throw new Error(`The command ${this.name} has no .run() callback defined`);
    await this._run(interaction.client as Client, interaction);
  }
} 