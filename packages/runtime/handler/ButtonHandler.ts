import type { ButtonInteraction, Client } from "discord.js";
import type Button from "../interactions/Button";

export default class ButtonHandler {
    private readonly client: Client;
    private readonly buttons: Map<string, Button> = new Map();

    constructor(client: Client) {
        this.client = client;
    }

    public add(button: Button): void {
        this.buttons.set(button.customId, button);
    }

    public set(buttons: Button[]): void {
        this.buttons.clear();
        buttons.forEach(button => this.add(button));
    }

    public delete(customId: string): void {
        this.buttons.delete(customId);
    }

    public async onButtonInteraction(interaction: ButtonInteraction): Promise<void> {
        const button = this.buttons.get(interaction.customId);
        if (!button) return;
        await button.execute(interaction);
    }
}