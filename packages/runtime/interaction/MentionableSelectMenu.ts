import {
	MentionableSelectMenuBuilder,
	type MentionableSelectMenuInteraction,
} from "discord.js";

export type MentionableSelectMenuRunFn = (
	interaction: MentionableSelectMenuInteraction,
	// biome-ignore lint/suspicious/noExplicitAny: Allow any return type for flexibility
) => any;

export default class MentionableSelectMenu extends MentionableSelectMenuBuilder {
	private _run?: MentionableSelectMenuRunFn;

	run(fn: MentionableSelectMenuRunFn): this {
		this._run = fn;
		return this;
	}

	async execute(interaction: MentionableSelectMenuInteraction): Promise<void> {
		if (!this._run) {
			throw new Error(
				`The mentionable select menu has no .run() callback defined`,
			);
		}
		await this._run(interaction);
	}
}
