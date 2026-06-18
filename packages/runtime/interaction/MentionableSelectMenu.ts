import {
	MentionableSelectMenuBuilder,
	type MentionableSelectMenuInteraction,
} from "discord.js";
import { WithCustomId } from "./WithCustomId";

export type MentionableSelectMenuRunFn<T = undefined> = (
	interaction: MentionableSelectMenuInteraction,
	data: T,
) => unknown;

export default class MentionableSelectMenu<
	TData = undefined,
> extends WithCustomId(MentionableSelectMenuBuilder, "MentionableSelectMenu") {
	withData<T>(): MentionableSelectMenu<T> {
		return this as unknown as MentionableSelectMenu<T>;
	}

	run<T = TData>(fn: MentionableSelectMenuRunFn<T>): this {
		this._run = fn as unknown as MentionableSelectMenuRunFn<TData>;
		return this;
	}

	setData(data: TData extends undefined ? never : TData, ttl?: number): this {
		return this._setData(data, ttl);
	}

	/** @internal */
	async execute(
		interaction: MentionableSelectMenuInteraction,
		data?: unknown,
	): Promise<void> {
		if (!this._run) {
			throw new Error(
				`The mentionable select menu has no .run() callback defined`,
			);
		}
		const finalData = (data !== undefined ? data : undefined) as TData;
		await this._run(interaction, finalData);
	}
}
