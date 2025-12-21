import {
	UserSelectMenuBuilder,
	type UserSelectMenuInteraction,
} from "discord.js";

export type UserSelectMenuRunFn = (
	interaction: UserSelectMenuInteraction,
	// biome-ignore lint/suspicious/noExplicitAny: Allow any return type for flexibility
) => any;

export default class UserSelectMenu extends UserSelectMenuBuilder {
	private _run?: UserSelectMenuRunFn;

	run(fn: UserSelectMenuRunFn): this {
		this._run = fn;
		return this;
	}

	async execute(interaction: UserSelectMenuInteraction): Promise<void> {
		if (!this._run) {
			throw new Error(`The user select menu has no .run() callback defined`);
		}
		await this._run(interaction);
	}
}
