import { type ChatInputCommandInteraction, type Client, SlashCommandSubcommandBuilder } from "discord.js";

export type SubcommandRunFn = (
  client: Client,
  interaction: ChatInputCommandInteraction
) => Promise<void> | void;

export class SubCommand extends SlashCommandSubcommandBuilder {
  private _run?: SubcommandRunFn;
  private _parent?: string;

  /**
   * Set the run function of the subcommand
   * @param fn - The run function of the subcommand
   * @returns The subcommand
   */
  run(fn: SubcommandRunFn): this {
    this._run = fn;
    return this;
  }

  /**
   * Set the parent of the subcommand
   * @param parent - The parent of the subcommand
   * @returns The subcommand
   */
  setParent(parent: string): this {
    this._parent = parent;
    return this;
  }

  /**
   * Get the parent of the subcommand
   * @returns The parent of the subcommand
   */
  getParent(): string | undefined {
    return this._parent;
  }

  async execute(interaction: ChatInputCommandInteraction) {
    if (!this._run) throw new Error(`The subcommand ${this.name} has no .run() callback defined`);
    await this._run(interaction.client as Client, interaction);
  }
} 