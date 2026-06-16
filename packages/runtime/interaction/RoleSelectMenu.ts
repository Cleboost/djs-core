import {
	RoleSelectMenuBuilder,
	type RoleSelectMenuInteraction,
} from "discord.js";
import { WithCustomId } from "./WithCustomId";

export type RoleSelectMenuRunFn<T = undefined> = (
	interaction: RoleSelectMenuInteraction,
	data: T,
) => unknown;

export default class RoleSelectMenu<TData = undefined> extends WithCustomId(
	RoleSelectMenuBuilder,
	"RoleSelectMenu",
) {
	run<T = TData>(fn: RoleSelectMenuRunFn<T>): this {
		this._run = fn as unknown as RoleSelectMenuRunFn<TData>;
		return this;
	}

	setData(data: TData extends undefined ? never : TData, ttl?: number): this {
		return this._setData(data, ttl);
	}

	async execute(
		interaction: RoleSelectMenuInteraction,
		data?: unknown,
	): Promise<void> {
		if (!this._run) {
			throw new Error(`The role select menu has no .run() callback defined`);
		}
		const finalData = (data !== undefined ? data : undefined) as TData;
		await this._run(interaction, finalData);
	}
}
