import {
	ChannelSelectMenuBuilder,
	type ChannelSelectMenuInteraction,
} from "discord.js";
import { WithCustomId } from "./WithCustomId";

export type ChannelSelectMenuRunFn<T = undefined> = (
	interaction: ChannelSelectMenuInteraction,
	data: T,
) => unknown;

export default class ChannelSelectMenu<TData = undefined> extends WithCustomId(
	ChannelSelectMenuBuilder,
	"ChannelSelectMenu",
) {
	withData<T>(): ChannelSelectMenu<T> {
		return this as unknown as ChannelSelectMenu<T>;
	}

	run<T = TData>(fn: ChannelSelectMenuRunFn<T>): this {
		this._run = fn as unknown as ChannelSelectMenuRunFn<TData>;
		return this;
	}

	setData(data: TData extends undefined ? never : TData, ttl?: number): this {
		return this._setData(data, ttl);
	}

	async execute(
		interaction: ChannelSelectMenuInteraction,
		data?: unknown,
	): Promise<void> {
		if (!this._run) {
			throw new Error(`The channel select menu has no .run() callback defined`);
		}
		const finalData = (data !== undefined ? data : undefined) as TData;
		await this._run(interaction, finalData);
	}
}
