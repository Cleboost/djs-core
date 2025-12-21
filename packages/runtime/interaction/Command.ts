import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
	type SlashCommandStringOption,
	type SlashCommandIntegerOption,
	type SlashCommandBooleanOption,
	type SlashCommandUserOption,
	type SlashCommandChannelOption,
	type SlashCommandRoleOption,
	type SlashCommandMentionableOption,
	type SlashCommandNumberOption,
	type SlashCommandAttachmentOption,
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

	// Override methods to return Command type instead of SlashCommandBuilder variants
	override addStringOption(
		input:
			| SlashCommandStringOption
			| ((option: SlashCommandStringOption) => SlashCommandStringOption),
	): this {
		super.addStringOption(input);
		return this;
	}

	override addIntegerOption(
		input:
			| SlashCommandIntegerOption
			| ((option: SlashCommandIntegerOption) => SlashCommandIntegerOption),
	): this {
		super.addIntegerOption(input);
		return this;
	}

	override addBooleanOption(
		input:
			| SlashCommandBooleanOption
			| ((option: SlashCommandBooleanOption) => SlashCommandBooleanOption),
	): this {
		super.addBooleanOption(input);
		return this;
	}

	override addUserOption(
		input:
			| SlashCommandUserOption
			| ((option: SlashCommandUserOption) => SlashCommandUserOption),
	): this {
		super.addUserOption(input);
		return this;
	}

	override addChannelOption(
		input:
			| SlashCommandChannelOption
			| ((option: SlashCommandChannelOption) => SlashCommandChannelOption),
	): this {
		super.addChannelOption(input);
		return this;
	}

	override addRoleOption(
		input:
			| SlashCommandRoleOption
			| ((option: SlashCommandRoleOption) => SlashCommandRoleOption),
	): this {
		super.addRoleOption(input);
		return this;
	}

	override addMentionableOption(
		input:
			| SlashCommandMentionableOption
			| ((option: SlashCommandMentionableOption) => SlashCommandMentionableOption),
	): this {
		super.addMentionableOption(input);
		return this;
	}

	override addNumberOption(
		input:
			| SlashCommandNumberOption
			| ((option: SlashCommandNumberOption) => SlashCommandNumberOption),
	): this {
		super.addNumberOption(input);
		return this;
	}

	override addAttachmentOption(
		input:
			| SlashCommandAttachmentOption
			| ((option: SlashCommandAttachmentOption) => SlashCommandAttachmentOption),
	): this {
		super.addAttachmentOption(input);
		return this;
	}

	override setName(name: string): this {
		super.setName(name);
		return this;
	}

	override setDescription(description: string): this {
		super.setDescription(description);
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
