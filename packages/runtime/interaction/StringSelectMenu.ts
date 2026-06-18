import {
	StringSelectMenuBuilder,
	type StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { WithCustomId } from "./WithCustomId";

export type StringSelectMenuRunFn<T = undefined> = (
	interaction: StringSelectMenuInteraction,
	data: T,
) => unknown;

export interface StringSelectMenuOption {
	emoji?: string;
	label: string;
	value: string;
}

export default class StringSelectMenu<TData = undefined> extends WithCustomId(
	StringSelectMenuBuilder,
	"StringSelectMenu",
) {
	withData<T>(): StringSelectMenu<T> {
		return this as unknown as StringSelectMenu<T>;
	}

	run<T = TData>(fn: StringSelectMenuRunFn<T>): this {
		this._run = fn as unknown as StringSelectMenuRunFn<TData>;
		return this;
	}

	setData(data: TData extends undefined ? never : TData, ttl?: number): this {
		return this._setData(data, ttl);
	}

	override addOptions(options: StringSelectMenuOption[]): this {
		for (const option of options) {
			const optionBuilder = new StringSelectMenuOptionBuilder()
				.setLabel(option.label)
				.setValue(option.value);
			if (option.emoji) optionBuilder.setEmoji(option.emoji);
			super.addOptions(optionBuilder);
		}
		return this;
	}

	/** @internal */
	clone(): StringSelectMenu {
		const cloned = new StringSelectMenu();
		if (this._baseCustomId) cloned._baseCustomId = this._baseCustomId;
		if (this._customId) cloned._customId = this._customId;
		if (this.data.custom_id) cloned.setCustomId(this.data.custom_id);
		if (this.data.placeholder) cloned.setPlaceholder(this.data.placeholder);
		if (this.data.min_values !== null && this.data.min_values !== undefined) {
			cloned.setMinValues(this.data.min_values);
		}
		if (this.data.max_values !== null && this.data.max_values !== undefined) {
			cloned.setMaxValues(this.data.max_values);
		}
		if (this.data.disabled) cloned.setDisabled(this.data.disabled);
		if (this._run) cloned.run(this._run);
		if (this.data.options) {
			cloned.addOptions(
				this.data.options.map((opt) => ({
					label: opt.label,
					value: opt.value,
					...(opt.emoji ? { emoji: String(opt.emoji) } : {}),
				})),
			);
		}
		return cloned;
	}

	/** @internal */
	async execute(
		interaction: StringSelectMenuInteraction,
		data?: unknown,
	): Promise<void> {
		if (!this._run) {
			throw new Error(`The string select menu has no .run() callback defined`);
		}
		const finalData = (data !== undefined ? data : undefined) as TData;
		await this._run(interaction, finalData);
	}
}
