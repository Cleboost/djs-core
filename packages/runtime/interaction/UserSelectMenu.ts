import {
	UserSelectMenuBuilder,
	type UserSelectMenuInteraction,
} from "discord.js";
import { WithCustomId } from "./WithCustomId";

export type UserSelectMenuRunFn<T = undefined> = (
	interaction: UserSelectMenuInteraction,
	data: T,
) => unknown;

export default class UserSelectMenu<TData = undefined> extends WithCustomId(
	UserSelectMenuBuilder,
	"UserSelectMenu",
) {
	run<T = TData>(fn: UserSelectMenuRunFn<T>): this {
		this._run = fn as unknown as UserSelectMenuRunFn<TData>;
		return this;
	}

	setData(data: TData extends undefined ? never : TData, ttl?: number): this {
		return this._setData(data, ttl);
	}

	async execute(
		interaction: UserSelectMenuInteraction,
		data?: unknown,
	): Promise<void> {
		if (!this._run) {
			throw new Error(`The user select menu has no .run() callback defined`);
		}
		const finalData = (data !== undefined ? data : undefined) as TData;
		await this._run(interaction, finalData);
	}
}
