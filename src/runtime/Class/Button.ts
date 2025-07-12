import { type ButtonInteraction, type Client } from "discord.js";

export type ButtonRunFn = (
  client: Client,
  interaction: ButtonInteraction,
) => Promise<void> | void;

export class Button {
  private _customId?: string;

  get customId(): string {
    if (!this._customId) {
      throw new Error("Button customId is not defined. Use .setCustomID(id) before registering the button.");
    }
    return this._customId;
  }

  private _run?: ButtonRunFn;

  constructor(customId?: string) {
    if (customId) this._customId = customId;
  }

  setCustomID(id: string): this {
    this._customId = id;
    return this;
  }

  run(fn: ButtonRunFn): this {
    this._run = fn;
    return this;
  }

  register?(_client: Client): Promise<void> | void;

  async execute(interaction: ButtonInteraction) {
    if (!this._run) {
      throw new Error(`The button with customId '${this.customId}' has no .run() callback defined`);
    }
    await this._run(interaction.client as Client, interaction);
  }
}