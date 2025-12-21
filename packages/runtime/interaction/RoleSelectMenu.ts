import { randomBytes } from "crypto";
import {
	RoleSelectMenuBuilder,
	type RoleSelectMenuInteraction,
} from "discord.js";
import { getSelectMenuData, storeSelectMenuData } from "../store/DataStore";

export type RoleSelectMenuRunFn<T = undefined> = (
	interaction: RoleSelectMenuInteraction,
	data: T,
	// biome-ignore lint/suspicious/noExplicitAny: Allow any return type for flexibility
) => any;

export default class RoleSelectMenu<
	TData = undefined,
> extends RoleSelectMenuBuilder {
	private _run?: RoleSelectMenuRunFn<TData>;
	private _baseCustomId?: string;
	private _customId?: string;

	run<T = TData>(fn: RoleSelectMenuRunFn<T>): this {
		this._run = fn as unknown as RoleSelectMenuRunFn<TData>;
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
				"RoleSelectMenu customId must be set before calling setData(). Use .setCustomId(id) first.",
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
				"RoleSelectMenu customId is not defined. Use .setCustomId(id) before registering the select menu.",
			);
		}
		return this._customId;
	}

	get baseCustomId(): string {
		if (!this._baseCustomId) {
			throw new Error(
				"RoleSelectMenu baseCustomId is not defined. Use .setCustomId(id) before registering the select menu.",
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
