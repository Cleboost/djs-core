import { randomBytes } from "crypto";
import {
	StringSelectMenuBuilder,
	type StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { getSelectMenuData, storeSelectMenuData } from "../store/DataStore";

export type StringSelectMenuRunFn<T = undefined> = (
	interaction: StringSelectMenuInteraction,
	data: T,
	// biome-ignore lint/suspicious/noExplicitAny: Allow any return type for flexibility
) => any;

export interface StringSelectMenuOption {
	emoji?: string;
	label: string;
	value: string;
}

export default class StringSelectMenu<
	TData = undefined,
> extends StringSelectMenuBuilder {
	private _run?: StringSelectMenuRunFn<TData>;
	private _baseCustomId?: string;
	private _customId?: string;

	run<T = TData>(fn: StringSelectMenuRunFn<T>): this {
		this._run = fn as unknown as StringSelectMenuRunFn<TData>;
		return this;
	}

	override setCustomId(customId: string): this {
		this._baseCustomId = customId;
		this._customId = customId;
		super.setCustomId(customId);
		return this;
	}

	setData(data: TData extends undefined ? never : TData, ttl?: number): this {
		if (!this._baseCustomId) {
			throw new Error(
				"StringSelectMenu customId must be set before calling setData(). Use .setCustomId(id) first.",
			);
		}
		const tokenBytes = randomBytes(8);
		const token = tokenBytes
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=/g, "");

		storeSelectMenuData(token, data, ttl);

		const newCustomId = `${this._baseCustomId}:${token}`;
		this._customId = newCustomId;
		super.setCustomId(newCustomId);

		return this;
	}

	get customId(): string {
		if (!this._customId) {
			throw new Error(
				"StringSelectMenu customId is not defined. Use .setCustomId(id) before registering the select menu.",
			);
		}
		return this._customId;
	}

	get baseCustomId(): string {
		if (!this._baseCustomId) {
			throw new Error(
				"StringSelectMenu baseCustomId is not defined. Use .setCustomId(id) before registering the select menu.",
			);
		}
		return this._baseCustomId;
	}

	static decodeData(customId: string): { baseId: string; data: unknown } {
		const lastColonIndex = customId.lastIndexOf(":");
		if (lastColonIndex === -1) {
			return { baseId: customId, data: undefined };
		}

		const baseId = customId.slice(0, lastColonIndex);
		const token = customId.slice(lastColonIndex + 1);

		if (!token) {
			return { baseId: customId, data: undefined };
		}

		const data = getSelectMenuData(token);

		return { baseId, data };
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
		if (this._baseCustomId) {
			cloned._baseCustomId = this._baseCustomId;
		}
		if (this._customId) {
			cloned._customId = this._customId;
		}
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
