import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";

export type CommandRunFn = (
	interaction: ChatInputCommandInteraction,
	// biome-ignore lint/suspicious/noExplicitAny: Allow any return type for flexibility
) => any;

export default class Command extends SlashCommandBuilder {
	private _run?: CommandRunFn;

	run(fn: CommandRunFn): this {
		this._run = fn;
		return this;
	}

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		if (!this._run) {
			throw new Error(
				`The command '${this.name}' has no .run() callback defined`,
			);
		}
		await this._run(interaction);
	}
}
