import type { Client } from "discord.js";
import { MessageFlags } from "discord.js";
import { decodeCustomIdHelper } from "../interaction/BaseInteraction";
import { handleInteractionError } from "../utils/error";

interface CustomIdItem {
	baseCustomId: string;
	execute(interaction: unknown, data: unknown): Promise<void>;
}

interface Repliable {
	customId: string;
	reply(options: { content: string; flags: number }): Promise<unknown>;
}

export default abstract class BaseHandler<
	TItem extends CustomIdItem,
	TInteraction extends Repliable,
> {
	protected readonly client: Client;
	protected readonly items: Map<string, TItem> = new Map();

	constructor(client: Client) {
		this.client = client;
	}

	public add(item: TItem): void {
		this.items.set(item.baseCustomId, item);
	}

	public set(items: TItem[]): void {
		this.items.clear();
		for (const item of items) {
			this.add(item);
		}
	}

	public delete(id: string): void {
		this.items.delete(id);
	}

	protected async dispatch(interaction: TInteraction): Promise<void> {
		const decoded = decodeCustomIdHelper(interaction.customId);
		const item = this.items.get(decoded.baseId);
		if (!item) return;

		const hasToken = decoded.baseId !== interaction.customId;
		if (hasToken && (decoded.expired || decoded.data === undefined)) {
			await interaction.reply({
				content: "❌ This interaction has expired or is no longer available.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		try {
			await item.execute(interaction, decoded.data);
		} catch (error) {
			await handleInteractionError(interaction, error);
		}
	}
}
