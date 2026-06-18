import {
	type APIRole,
	type ApplicationCommandOptionChoiceData,
	type Attachment,
	type AutocompleteInteraction,
	type ChatInputCommandInteraction,
	type GuildBasedChannel,
	type GuildMember,
	type Role,
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
	type User,
} from "discord.js";

// ---------------------------------------------------------------------------
// Probe interfaces — TypeScript type-level only, used for name/required inference.
// Each probe overrides setName/setRequired to carry literal types as brands.
// ---------------------------------------------------------------------------

interface OptionProbe {
	setName<N extends string>(name: N): this & { readonly __name: N };
	setRequired<R extends boolean>(
		required: R,
	): this & { readonly __required: R };
}

export interface StringOptionProbe extends OptionProbe {
	setDescription(desc: string): this;
	setMinLength(min: number): this;
	setMaxLength(max: number): this;
	setAutocomplete(enabled: boolean): this;
	addChoices(...choices: ApplicationCommandOptionChoiceData<string>[]): this;
}

export interface IntegerOptionProbe extends OptionProbe {
	setDescription(desc: string): this;
	setMinValue(min: number): this;
	setMaxValue(max: number): this;
	setAutocomplete(enabled: boolean): this;
	addChoices(...choices: ApplicationCommandOptionChoiceData<number>[]): this;
}

export interface NumberOptionProbe extends OptionProbe {
	setDescription(desc: string): this;
	setMinValue(min: number): this;
	setMaxValue(max: number): this;
	setAutocomplete(enabled: boolean): this;
	addChoices(...choices: ApplicationCommandOptionChoiceData<number>[]): this;
}

export interface BooleanOptionProbe extends OptionProbe {
	setDescription(desc: string): this;
}

export interface UserOptionProbe extends OptionProbe {
	setDescription(desc: string): this;
}

export interface ChannelOptionProbe extends OptionProbe {
	setDescription(desc: string): this;
	addChannelTypes(...types: number[]): this;
}

export interface RoleOptionProbe extends OptionProbe {
	setDescription(desc: string): this;
}

export interface MentionableOptionProbe extends OptionProbe {
	setDescription(desc: string): this;
}

export interface AttachmentOptionProbe extends OptionProbe {
	setDescription(desc: string): this;
}

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

type ExtractName<T> = T extends { readonly __name: infer N extends string }
	? N
	: never;
type ExtractRequired<T> = T extends {
	readonly __required: infer R extends boolean;
}
	? R
	: false;

type AppendOption<TOptions, TName extends string, TValue> = [TName] extends [
	never,
]
	? TOptions
	: TOptions & { [K in TName]: TValue };

type Resolve<TRequired extends boolean, TValue> = TRequired extends true
	? TValue
	: TValue | null;

// ---------------------------------------------------------------------------
// Runtime option metadata — used in execute() to build the typed options object
// ---------------------------------------------------------------------------

type OptionType =
	| "string"
	| "integer"
	| "number"
	| "boolean"
	| "user"
	| "channel"
	| "role"
	| "mentionable"
	| "attachment";

type OptionMeta = { name: string; type: OptionType; required: boolean };

function createOptionSpy(): { proxy: unknown; meta: OptionMeta } {
	const meta: OptionMeta = { name: "", type: "string", required: false };
	// biome-ignore lint/suspicious/noExplicitAny: Proxy must intercept arbitrary method calls
	const proxy: any = new Proxy({} as any, {
		get(_target, prop: string) {
			if (prop === "setName")
				return (n: string) => {
					meta.name = n;
					return proxy;
				};
			if (prop === "setRequired")
				return (r: boolean) => {
					meta.required = !!r;
					return proxy;
				};
			return () => proxy;
		},
	});
	return { proxy, meta };
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type CommandRunFn<
	TOptions extends Record<string, unknown> = Record<never, never>,
> = (interaction: ChatInputCommandInteraction, options: TOptions) => unknown;

export type CommandAutocompleteFn = (
	interaction: AutocompleteInteraction,
) => unknown;

export type AutocompleteOptionFn = (
	value: string,
	interaction: AutocompleteInteraction,
) =>
	| ApplicationCommandOptionChoiceData[]
	| Promise<ApplicationCommandOptionChoiceData[]>;

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export default class Command<
	TOptions extends Record<string, unknown> = Record<never, never>,
> extends SlashCommandBuilder {
	// biome-ignore lint/suspicious/noExplicitAny: options generic resolved at runtime
	private _run?: (
		interaction: ChatInputCommandInteraction,
		options: any,
	) => unknown;
	private _runAutocomplete?: CommandAutocompleteFn;
	private _autocompleteHandlers = new Map<string, AutocompleteOptionFn>();
	private _optionsMeta: OptionMeta[] = [];

	run(fn: CommandRunFn<TOptions>): this {
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

	// -------------------------------------------------------------------------
	// Option overrides
	//
	// Each method needs three declarations with noImplicitOverride: true:
	//   1. Inference overload (callback → new generic) — ts-suppress suppresses
	//      TS2416 because the return type intentionally diverges from the base
	//   2. Pass-through overload (instance → this) — compatible with base
	//   3. Implementation (any → any) — runtime body
	// -------------------------------------------------------------------------

	// biome-ignore lint/suspicious/noTsIgnore: TS2416 is version-dependent, ts-ignore is safer than ts-expect-error
	// @ts-ignore
	override addStringOption<
		TResult extends StringOptionProbe,
		TName extends string = ExtractName<TResult>,
		TRequired extends boolean = ExtractRequired<TResult>,
	>(
		fn: (opt: StringOptionProbe) => TResult,
	): Command<AppendOption<TOptions, TName, Resolve<TRequired, string>>>;
	override addStringOption(opt: SlashCommandStringOption): this;
	// biome-ignore lint/suspicious/noExplicitAny: implementation overload
	override addStringOption(input: any): any {
		if (typeof input === "function") {
			const { proxy, meta } = createOptionSpy();
			meta.type = "string";
			input(proxy);
			if (meta.name) this._optionsMeta.push(meta);
		}
		super.addStringOption(input);
		return this;
	}

	// biome-ignore lint/suspicious/noTsIgnore: TS2416 is version-dependent, ts-ignore is safer than ts-expect-error
	// @ts-ignore
	override addIntegerOption<
		TResult extends IntegerOptionProbe,
		TName extends string = ExtractName<TResult>,
		TRequired extends boolean = ExtractRequired<TResult>,
	>(
		fn: (opt: IntegerOptionProbe) => TResult,
	): Command<AppendOption<TOptions, TName, Resolve<TRequired, number>>>;
	override addIntegerOption(opt: SlashCommandIntegerOption): this;
	// biome-ignore lint/suspicious/noExplicitAny: implementation overload
	override addIntegerOption(input: any): any {
		if (typeof input === "function") {
			const { proxy, meta } = createOptionSpy();
			meta.type = "integer";
			input(proxy);
			if (meta.name) this._optionsMeta.push(meta);
		}
		super.addIntegerOption(input);
		return this;
	}

	// biome-ignore lint/suspicious/noTsIgnore: TS2416 is version-dependent, ts-ignore is safer than ts-expect-error
	// @ts-ignore
	override addNumberOption<
		TResult extends NumberOptionProbe,
		TName extends string = ExtractName<TResult>,
		TRequired extends boolean = ExtractRequired<TResult>,
	>(
		fn: (opt: NumberOptionProbe) => TResult,
	): Command<AppendOption<TOptions, TName, Resolve<TRequired, number>>>;
	override addNumberOption(opt: SlashCommandNumberOption): this;
	// biome-ignore lint/suspicious/noExplicitAny: implementation overload
	override addNumberOption(input: any): any {
		if (typeof input === "function") {
			const { proxy, meta } = createOptionSpy();
			meta.type = "number";
			input(proxy);
			if (meta.name) this._optionsMeta.push(meta);
		}
		super.addNumberOption(input);
		return this;
	}

	// biome-ignore lint/suspicious/noTsIgnore: TS2416 is version-dependent, ts-ignore is safer than ts-expect-error
	// @ts-ignore
	override addBooleanOption<
		TResult extends BooleanOptionProbe,
		TName extends string = ExtractName<TResult>,
		TRequired extends boolean = ExtractRequired<TResult>,
	>(
		fn: (opt: BooleanOptionProbe) => TResult,
	): Command<AppendOption<TOptions, TName, Resolve<TRequired, boolean>>>;
	override addBooleanOption(opt: SlashCommandBooleanOption): this;
	// biome-ignore lint/suspicious/noExplicitAny: implementation overload
	override addBooleanOption(input: any): any {
		if (typeof input === "function") {
			const { proxy, meta } = createOptionSpy();
			meta.type = "boolean";
			input(proxy);
			if (meta.name) this._optionsMeta.push(meta);
		}
		super.addBooleanOption(input);
		return this;
	}

	// biome-ignore lint/suspicious/noTsIgnore: TS2416 is version-dependent, ts-ignore is safer than ts-expect-error
	// @ts-ignore
	override addUserOption<
		TResult extends UserOptionProbe,
		TName extends string = ExtractName<TResult>,
		TRequired extends boolean = ExtractRequired<TResult>,
	>(
		fn: (opt: UserOptionProbe) => TResult,
	): Command<AppendOption<TOptions, TName, Resolve<TRequired, User>>>;
	override addUserOption(opt: SlashCommandUserOption): this;
	// biome-ignore lint/suspicious/noExplicitAny: implementation overload
	override addUserOption(input: any): any {
		if (typeof input === "function") {
			const { proxy, meta } = createOptionSpy();
			meta.type = "user";
			input(proxy);
			if (meta.name) this._optionsMeta.push(meta);
		}
		super.addUserOption(input);
		return this;
	}

	// biome-ignore lint/suspicious/noTsIgnore: TS2416 is version-dependent, ts-ignore is safer than ts-expect-error
	// @ts-ignore
	override addChannelOption<
		TResult extends ChannelOptionProbe,
		TName extends string = ExtractName<TResult>,
		TRequired extends boolean = ExtractRequired<TResult>,
	>(
		fn: (opt: ChannelOptionProbe) => TResult,
	): Command<
		AppendOption<TOptions, TName, Resolve<TRequired, GuildBasedChannel>>
	>;
	override addChannelOption(opt: SlashCommandChannelOption): this;
	// biome-ignore lint/suspicious/noExplicitAny: implementation overload
	override addChannelOption(input: any): any {
		if (typeof input === "function") {
			const { proxy, meta } = createOptionSpy();
			meta.type = "channel";
			input(proxy);
			if (meta.name) this._optionsMeta.push(meta);
		}
		super.addChannelOption(input);
		return this;
	}

	// biome-ignore lint/suspicious/noTsIgnore: TS2416 is version-dependent, ts-ignore is safer than ts-expect-error
	// @ts-ignore
	override addRoleOption<
		TResult extends RoleOptionProbe,
		TName extends string = ExtractName<TResult>,
		TRequired extends boolean = ExtractRequired<TResult>,
	>(
		fn: (opt: RoleOptionProbe) => TResult,
	): Command<AppendOption<TOptions, TName, Resolve<TRequired, Role | APIRole>>>;
	override addRoleOption(opt: SlashCommandRoleOption): this;
	// biome-ignore lint/suspicious/noExplicitAny: implementation overload
	override addRoleOption(input: any): any {
		if (typeof input === "function") {
			const { proxy, meta } = createOptionSpy();
			meta.type = "role";
			input(proxy);
			if (meta.name) this._optionsMeta.push(meta);
		}
		super.addRoleOption(input);
		return this;
	}

	// biome-ignore lint/suspicious/noTsIgnore: TS2416 is version-dependent, ts-ignore is safer than ts-expect-error
	// @ts-ignore
	override addMentionableOption<
		TResult extends MentionableOptionProbe,
		TName extends string = ExtractName<TResult>,
		TRequired extends boolean = ExtractRequired<TResult>,
	>(
		fn: (opt: MentionableOptionProbe) => TResult,
	): Command<
		AppendOption<
			TOptions,
			TName,
			Resolve<TRequired, User | GuildMember | Role | APIRole>
		>
	>;
	override addMentionableOption(opt: SlashCommandMentionableOption): this;
	// biome-ignore lint/suspicious/noExplicitAny: implementation overload
	override addMentionableOption(input: any): any {
		if (typeof input === "function") {
			const { proxy, meta } = createOptionSpy();
			meta.type = "mentionable";
			input(proxy);
			if (meta.name) this._optionsMeta.push(meta);
		}
		super.addMentionableOption(input);
		return this;
	}

	// biome-ignore lint/suspicious/noTsIgnore: TS2416 is version-dependent, ts-ignore is safer than ts-expect-error
	// @ts-ignore
	override addAttachmentOption<
		TResult extends AttachmentOptionProbe,
		TName extends string = ExtractName<TResult>,
		TRequired extends boolean = ExtractRequired<TResult>,
	>(
		fn: (opt: AttachmentOptionProbe) => TResult,
	): Command<AppendOption<TOptions, TName, Resolve<TRequired, Attachment>>>;
	override addAttachmentOption(opt: SlashCommandAttachmentOption): this;
	// biome-ignore lint/suspicious/noExplicitAny: implementation overload
	override addAttachmentOption(input: any): any {
		if (typeof input === "function") {
			const { proxy, meta } = createOptionSpy();
			meta.type = "attachment";
			input(proxy);
			if (meta.name) this._optionsMeta.push(meta);
		}
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

		const options: Record<string, unknown> = {};
		for (const meta of this._optionsMeta) {
			switch (meta.type) {
				case "string":
					options[meta.name] = interaction.options.getString(
						meta.name,
						meta.required as true,
					);
					break;
				case "integer":
					options[meta.name] = interaction.options.getInteger(
						meta.name,
						meta.required as true,
					);
					break;
				case "number":
					options[meta.name] = interaction.options.getNumber(
						meta.name,
						meta.required as true,
					);
					break;
				case "boolean":
					options[meta.name] = interaction.options.getBoolean(
						meta.name,
						meta.required as true,
					);
					break;
				case "user":
					options[meta.name] = interaction.options.getUser(
						meta.name,
						meta.required as true,
					);
					break;
				case "channel":
					options[meta.name] = interaction.options.getChannel(
						meta.name,
						meta.required as true,
					);
					break;
				case "role":
					options[meta.name] = interaction.options.getRole(
						meta.name,
						meta.required as true,
					);
					break;
				case "mentionable":
					options[meta.name] = interaction.options.getMentionable(
						meta.name,
						meta.required as true,
					);
					break;
				case "attachment":
					options[meta.name] = interaction.options.getAttachment(
						meta.name,
						meta.required as true,
					);
					break;
			}
		}

		await this._run(interaction, options);
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
