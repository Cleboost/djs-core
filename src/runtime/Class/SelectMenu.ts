import { type StringSelectMenuInteraction, type Client } from "discord.js";

export type SelectMenuRunFn = (
  client: Client,
  interaction: StringSelectMenuInteraction,
) => Promise<void> | void;

export class SelectMenu {
  private _customId?: string;

  get customId(): string {
    if (!this._customId) {
      throw new Error("SelectMenu customId is not defined. Use .setCustomID(id) before registering the select menu.");
    }
    return this._customId;
  }

  private _run?: SelectMenuRunFn;

  constructor(customId?: string) {
    if (customId) this._customId = customId;
  }

  /**
   * Set the custom id of the select menu
   * @param id - The custom id of the select menu
   * @returns The select menu
   */
  setCustomID(id: string): this {
    this._customId = id;
    return this;
  }

  /**
   * Set the custom id of the select menu
   * @param id - The custom id of the select menu
   * @returns The select menu
   */
  setCustomId(id: string): this {
    return this.setCustomID(id);
  }

  /**
   * Set the run function of the select menu
   * @param fn - The run function of the select menu
   * @returns The select menu
   */
  run(fn: SelectMenuRunFn): this {
    this._run = fn;
    return this;
  }

  register?(_client: Client): Promise<void> | void;

  async execute(interaction: StringSelectMenuInteraction) {
    if (!this._run) {
      throw new Error(`The select menu with customId '${this.customId}' has no .run() callback defined`);
    }
    await this._run(interaction.client as Client, interaction);
  }
} 