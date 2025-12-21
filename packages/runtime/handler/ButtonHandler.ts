import type { ButtonInteraction, Client } from "discord.js";
import { MessageFlags } from "discord.js";
import Button from "../interaction/Button";

export default class ButtonHandler {
	private readonly client: Client;
	private readonly buttons: Map<string, Button> = new Map();

	constructor(client: Client) {
		this.client = client;
	}

	public add(button: Button): void {
		this.buttons.set(button.baseCustomId, button);
	}

	public set(buttons: Button[]): void {
		this.buttons.clear();
		for (const button of buttons) {
			this.add(button);
		}
	}

	public delete(customId: string): void {
		this.buttons.delete(customId);
	}

	public async onButtonInteraction(
		interaction: ButtonInteraction,
	): Promise<void> {
		const decoded = Button.decodeData(interaction.customId);

		const button = this.buttons.get(decoded.baseId);
		if (!button) return;

		const hasToken = decoded.baseId !== interaction.customId;

		if (hasToken && decoded.data === undefined) {
			await interaction.reply({
				content: "❌ This interaction has expired or is no longer available.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await button.execute(interaction, decoded.data);
	}
}
