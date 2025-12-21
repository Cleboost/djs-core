import {
	RoleSelectMenuBuilder,
	type RoleSelectMenuInteraction,
} from "discord.js";

export type RoleSelectMenuRunFn = (
	interaction: RoleSelectMenuInteraction,
	// biome-ignore lint/suspicious/noExplicitAny: Allow any return type for flexibility
) => any;

export default class RoleSelectMenu extends RoleSelectMenuBuilder {
	private _run?: RoleSelectMenuRunFn;

	run(fn: RoleSelectMenuRunFn): this {
		this._run = fn;
		return this;
	}

	async execute(interaction: RoleSelectMenuInteraction): Promise<void> {
		if (!this._run) {
			throw new Error(`The role select menu has no .run() callback defined`);
		}
		await this._run(interaction);
	}
}
