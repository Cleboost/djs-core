import { ButtonBuilder, type ButtonInteraction, type Client } from "discord.js";
import { randomBytes } from "crypto";
import { storeButtonData, getButtonData } from "../store/ButtonDataStore";

export type ButtonRunFn<T = undefined> = (
	client: Client,
	interaction: ButtonInteraction,
	data: T,
	// biome-ignore lint/suspicious/noExplicitAny: Allow any return type for flexibility
) => any;

export default class Button<TData = undefined> extends ButtonBuilder {
	private _run?: ButtonRunFn<TData>;
	private _baseCustomId?: string;
	private _customId?: string;

	run<T = TData>(fn: ButtonRunFn<T>): this {
		this._run = fn as unknown as ButtonRunFn<TData>;
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
				"Button customId must be set before calling setData(). Use .setCustomId(id) first.",
			);
		}
		const tokenBytes = randomBytes(8);
		const token = tokenBytes
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=/g, "");

		storeButtonData(token, data, ttl);

		const newCustomId = `${this._baseCustomId}:${token}`;
		this._customId = newCustomId;
		super.setCustomId(newCustomId);

		return this;
	}

	get customId(): string {
		if (!this._customId) {
			throw new Error(
				"Button customId is not defined. Use .setCustomId(id) before registering the button.",
			);
		}
		return this._customId;
	}

	get baseCustomId(): string {
		if (!this._baseCustomId) {
			throw new Error(
				"Button baseCustomId is not defined. Use .setCustomId(id) before registering the button.",
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

		const data = getButtonData(token);

		return { baseId, data };
	}

	async execute(interaction: ButtonInteraction, data?: unknown): Promise<void> {
		if (!this._run) {
			throw new Error(
				`The button '${this._customId}' has no .run() callback defined`,
			);
		}
		const finalData = (data !== undefined ? data : undefined) as TData;
		await this._run(interaction.client, interaction, finalData);
	}
}
