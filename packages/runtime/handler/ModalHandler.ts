import type { Client, ModalSubmitInteraction } from "discord.js";
import { MessageFlags } from "discord.js";
import Modal from "../interaction/Modal";

export default class ModalHandler {
	private readonly client: Client;
	private readonly modals: Map<string, Modal> = new Map();

	constructor(client: Client) {
		this.client = client;
	}

	public add(modal: Modal): void {
		this.modals.set(modal.baseCustomId, modal);
	}

	public set(modals: Modal[]): void {
		this.modals.clear();
		for (const modal of modals) {
			this.add(modal);
		}
	}

	public delete(customId: string): void {
		this.modals.delete(customId);
	}

	public async onModalSubmit(
		interaction: ModalSubmitInteraction,
	): Promise<void> {
		const decoded = Modal.decodeData(interaction.customId);

		const modal = this.modals.get(decoded.baseId);
		if (!modal) return;

		const hasToken = decoded.baseId !== interaction.customId;

		if (hasToken && decoded.data === undefined) {
			await interaction.reply({
				content: "❌ This interaction has expired or is no longer available.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		try {
			await modal.execute(interaction, decoded.data);
		} catch (e) {
			console.error(e);
			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({
					content: "An error occurred.",
					flags: MessageFlags.Ephemeral,
				});
			}
		}
	}
}

