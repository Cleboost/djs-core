import {
	ChannelSelectMenuBuilder,
	type ChannelSelectMenuInteraction,
} from "discord.js";

export type ChannelSelectMenuRunFn = (
	interaction: ChannelSelectMenuInteraction,
	// biome-ignore lint/suspicious/noExplicitAny: Allow any return type for flexibility
) => any;

export default class ChannelSelectMenu extends ChannelSelectMenuBuilder {
	private _run?: ChannelSelectMenuRunFn;

	run(fn: ChannelSelectMenuRunFn): this {
		this._run = fn;
		return this;
	}

	async execute(interaction: ChannelSelectMenuInteraction): Promise<void> {
		if (!this._run) {
			throw new Error(`The channel select menu has no .run() callback defined`);
		}
		await this._run(interaction);
	}
}
