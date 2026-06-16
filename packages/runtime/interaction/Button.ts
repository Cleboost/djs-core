import { ButtonBuilder, type ButtonInteraction } from "discord.js";
import { WithCustomId } from "./WithCustomId";

export type ButtonRunFn<T = undefined> = (
	interaction: ButtonInteraction,
	data: T,
) => unknown;

export default class Button<TData = undefined> extends WithCustomId(
	ButtonBuilder,
	"Button",
) {
	run<T = TData>(fn: ButtonRunFn<T>): this {
		this._run = fn as unknown as ButtonRunFn<TData>;
		return this;
	}

	setData(data: TData extends undefined ? never : TData, ttl?: number): this {
		return this._setData(data, ttl);
	}

	async execute(interaction: ButtonInteraction, data?: unknown): Promise<void> {
		if (!this._run) {
			throw new Error(
				`The button '${this._customId}' has no .run() callback defined`,
			);
		}
		const finalData = (data !== undefined ? data : undefined) as TData;
		await this._run(interaction, finalData);
	}
}
