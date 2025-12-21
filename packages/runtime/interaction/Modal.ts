import { randomBytes } from "crypto";
import { ModalBuilder, type ModalSubmitInteraction } from "discord.js";
import { getModalData, storeModalData } from "../store/DataStore";

export type ModalRunFn<T = undefined> = (
	interaction: ModalSubmitInteraction,
	data: T,
	// biome-ignore lint/suspicious/noExplicitAny: Allow any return type for flexibility
) => any;

export default class Modal<TData = undefined> extends ModalBuilder {
	private _run?: ModalRunFn<TData>;
	private _baseCustomId?: string;
	private _customId?: string;

	run<T = TData>(fn: ModalRunFn<T>): this {
		this._run = fn as unknown as ModalRunFn<TData>;
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
				"Modal customId must be set before calling setData(). Use .setCustomId(id) first.",
			);
		}
		const tokenBytes = randomBytes(8);
		const token = tokenBytes
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=/g, "");

		storeModalData(token, data, ttl);

		const newCustomId = `${this._baseCustomId}:${token}`;
		this._customId = newCustomId;
		super.setCustomId(newCustomId);

		return this;
	}

	get customId(): string {
		if (!this._customId) {
			throw new Error(
				"Modal customId is not defined. Use .setCustomId(id) before registering the modal.",
			);
		}
		return this._customId;
	}

	get baseCustomId(): string {
		if (!this._baseCustomId) {
			throw new Error(
				"Modal baseCustomId is not defined. Use .setCustomId(id) before registering the modal.",
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

		const data = getModalData(token);

		return { baseId, data };
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
