import {
	StringSelectMenuBuilder,
	type StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder,
} from "discord.js";

export type StringSelectMenuRunFn = (
	interaction: StringSelectMenuInteraction,
	// biome-ignore lint/suspicious/noExplicitAny: Allow any return type for flexibility
) => any;

export interface StringSelectMenuOption {
	emoji?: string;
	label: string;
	value: string;
}

export default class StringSelectMenu extends StringSelectMenuBuilder {
	private _run?: StringSelectMenuRunFn;

	run(fn: StringSelectMenuRunFn): this {
		this._run = fn;
		return this;
	}

	override addOptions(options: StringSelectMenuOption[]): this {
		const cloned = this.clone();
		for (const option of options) {
			const optionBuilder = new StringSelectMenuOptionBuilder()
				.setLabel(option.label)
				.setValue(option.value);
			if (option.emoji) {
				optionBuilder.setEmoji(option.emoji);
			}
			super.addOptions.call(cloned, optionBuilder);
		}
		Object.setPrototypeOf(cloned, Object.getPrototypeOf(this));
		Object.assign(this, cloned);
		return this;
	}

	clone(): StringSelectMenu {
		const cloned = new StringSelectMenu();
		if (this.data.custom_id) {
			cloned.setCustomId(this.data.custom_id);
		}
		if (this.data.placeholder) {
			cloned.setPlaceholder(this.data.placeholder);
		}
		if (this.data.min_values !== null && this.data.min_values !== undefined) {
			cloned.setMinValues(this.data.min_values);
		}
		if (this.data.max_values !== null && this.data.max_values !== undefined) {
			cloned.setMaxValues(this.data.max_values);
		}
		if (this.data.disabled) {
			cloned.setDisabled(this.data.disabled);
		}

		if (this._run) {
			cloned.run(this._run);
		}

		if (this.data.options) {
			for (const opt of this.data.options) {
				const optionBuilder = new StringSelectMenuOptionBuilder()
					.setLabel(opt.label)
					.setValue(opt.value);
				if (opt.emoji) {
					if (typeof opt.emoji === "string") {
						optionBuilder.setEmoji(opt.emoji);
					} else {
						optionBuilder.setEmoji(opt.emoji);
					}
				}
				super.addOptions.call(cloned, optionBuilder);
			}
		}

		return cloned;
	}

	async execute(interaction: StringSelectMenuInteraction): Promise<void> {
		if (!this._run) {
			throw new Error(`The string select menu has no .run() callback defined`);
		}
		await this._run(interaction);
	}
}
