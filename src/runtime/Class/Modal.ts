import { type ModalSubmitInteraction, type Client } from "discord.js";

export type ModalRunFn = (
  client: Client,
  interaction: ModalSubmitInteraction,
) => Promise<void> | void;

export class Modal {
  private _customId?: string;

  get customId(): string {
    if (!this._customId) {
      throw new Error("Modal customId is not defined. Use .setCustomID(id) before registering the modal.");
    }
    return this._customId;
  }

  private _run?: ModalRunFn;

  constructor(customId?: string) {
    if (customId) this._customId = customId;
  }

  setCustomID(id: string): this {
    this._customId = id;
    return this;
  }
  setCustomId(id: string): this {
    return this.setCustomID(id);
  }

  run(fn: ModalRunFn): this {
    this._run = fn;
    return this;
  }

  register?(_client: Client): Promise<void> | void;

  async execute(interaction: ModalSubmitInteraction) {
    if (!this._run) {
      throw new Error(`The modal with customId '${this.customId}' has no .run() callback defined`);
    }
    await this._run(interaction.client as Client, interaction);
  }
} 