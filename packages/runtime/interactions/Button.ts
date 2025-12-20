import { ButtonBuilder, ButtonInteraction, Client } from "discord.js";

export type ButtonRunFn = (
    client: Client,
    interaction: ButtonInteraction
  ) => any;

export default class Button extends ButtonBuilder {
    private _run?: ButtonRunFn;
    private _customId?: string;

    run(fn: ButtonRunFn): this {
        this._run = fn;
        return this;
    }

    override setCustomId(customId: string): this {
        this._customId = customId;
        super.setCustomId(customId);
        return this;
    }

    get customId(): string {
        if (!this._customId) {
            throw new Error("Button customId is not defined. Use .setCustomId(id) before registering the button.");
        }
        return this._customId;
    }

    async execute(interaction: ButtonInteraction): Promise<void> {
        if (!this._run) {
            throw new Error(`The button '${this._customId}' has no .run() callback defined`);
        }
        await this._run(interaction.client, interaction);
    }
}