import { ModalBuilder, type ModalSubmitInteraction } from "discord.js";
import { WithCustomId } from "./WithCustomId";

export type ModalRunFn<T = undefined> = (
	interaction: ModalSubmitInteraction,
	data: T,
) => unknown;

export default class Modal<TData = undefined> extends WithCustomId(
	ModalBuilder,
	"Modal",
) {
	run<T = TData>(fn: ModalRunFn<T>): this {
		this._run = fn as unknown as ModalRunFn<TData>;
		return this;
	}

	setData(data: TData extends undefined ? never : TData, ttl?: number): this {
		return this._setData(data, ttl);
	}

	async execute(
		interaction: ModalSubmitInteraction,
		data?: unknown,
	): Promise<void> {
		if (!this._run) {
			throw new Error(
				`The modal '${this.data.title}' has no .run() callback defined`,
			);
		}
		const finalData = (data !== undefined ? data : undefined) as TData;
		await this._run(interaction, finalData);
	}
}
