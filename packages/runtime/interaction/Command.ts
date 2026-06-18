import {
	type ApplicationCommandOptionChoiceData,
	type AutocompleteInteraction,
	type ChatInputCommandInteraction,
	type SlashCommandAttachmentOption,
	type SlashCommandBooleanOption,
	SlashCommandBuilder,
	type SlashCommandChannelOption,
	type SlashCommandIntegerOption,
	type SlashCommandMentionableOption,
	type SlashCommandNumberOption,
	type SlashCommandRoleOption,
	type SlashCommandStringOption,
	type SlashCommandSubcommandBuilder,
	type SlashCommandSubcommandGroupBuilder,
	type SlashCommandUserOption,
} from "discord.js";

export type CommandRunFn = (
	interaction: ChatInputCommandInteraction,
) => unknown;

export type CommandAutocompleteFn = (
	interaction: AutocompleteInteraction,
) => unknown;

export type AutocompleteOptionFn = (
	value: string,
	interaction: AutocompleteInteraction,
) => ApplicationCommandOptionChoiceData[] | Promise<ApplicationCommandOptionChoiceData[]>;

export default class Command extends SlashCommandBuilder {
	private _run?: CommandRunFn;
	private _runAutocomplete?: CommandAutocompleteFn;
	private _autocompleteHandlers = new Map<string, AutocompleteOptionFn>();

	run(fn: CommandRunFn): this {
		this._run = fn;
		return this;
	}

	autocomplete(optionName: string, fn: AutocompleteOptionFn): this {
		this._autocompleteHandlers.set(optionName, fn);
		return this;
	}

	runAutocomplete(fn: CommandAutocompleteFn): this {
		this._runAutocomplete = fn;
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
			| ((
					option: SlashCommandMentionableOption,
			  ) => SlashCommandMentionableOption),
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
			| ((
					option: SlashCommandAttachmentOption,
			  ) => SlashCommandAttachmentOption),
	): this {
		super.addAttachmentOption(input);
		return this;
	}

	override addSubcommand(
		input:
			| SlashCommandSubcommandBuilder
			| ((
					subcommand: SlashCommandSubcommandBuilder,
			  ) => SlashCommandSubcommandBuilder),
	): this {
		super.addSubcommand(input);
		return this;
	}

	override addSubcommandGroup(
		input:
			| SlashCommandSubcommandGroupBuilder
			| ((
					subcommandGroup: SlashCommandSubcommandGroupBuilder,
			  ) => SlashCommandSubcommandGroupBuilder),
	): this {
		super.addSubcommandGroup(input);
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

	async executeAutocomplete(
		interaction: AutocompleteInteraction,
	): Promise<void> {
		const focused = interaction.options.getFocused(true);
		const handler = this._autocompleteHandlers.get(focused.name);

		if (handler) {
			const choices = await handler(focused.value, interaction);
			await interaction.respond(choices);
			return;
		}

		if (this._runAutocomplete) {
			await this._runAutocomplete(interaction);
		}
	}
}
