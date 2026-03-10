import {
	ChannelSelectMenuBuilder,
	type ChannelSelectMenuInteraction,
} from "discord.js";
import {
	decodeCustomIdHelper,
	storeInteractionDataHelper,
} from "./BaseInteraction";

export type ChannelSelectMenuRunFn<T = undefined> = (
	interaction: ChannelSelectMenuInteraction,
	data: T,
) => unknown;

export default class ChannelSelectMenu<
	TData = undefined,
> extends ChannelSelectMenuBuilder {
	private _run?: ChannelSelectMenuRunFn<TData>;
	private _baseCustomId?: string;
	private _customId?: string;

	run<T = TData>(fn: ChannelSelectMenuRunFn<T>): this {
		this._run = fn as unknown as ChannelSelectMenuRunFn<TData>;
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
				"ChannelSelectMenu customId must be set before calling setData(). Use .setCustomId(id) first.",
			);
		}

		const token = storeInteractionDataHelper(data, ttl);
		const newCustomId = `${this._baseCustomId}:${token}`;
		this._customId = newCustomId;
		super.setCustomId(newCustomId);

		return this;
	}

	get customId(): string {
		if (!this._customId) {
			throw new Error(
				"ChannelSelectMenu customId is not defined. Use .setCustomId(id) before registering the select menu.",
			);
		}
		return this._customId;
	}

	get baseCustomId(): string {
		if (!this._baseCustomId) {
			throw new Error(
				"ChannelSelectMenu baseCustomId is not defined. Use .setCustomId(id) before registering the select menu.",
			);
		}
		return this._baseCustomId;
	}

	static decodeData(customId: string): { baseId: string; data: unknown } {
		return decodeCustomIdHelper(customId);
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
