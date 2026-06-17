import {
	decodeCustomIdHelper,
	storeInteractionDataHelper,
} from "./BaseInteraction";

// biome-ignore lint/suspicious/noExplicitAny: mixin constructor constraint
type AnyConstructor = new (...args: any[]) => any;

export function WithCustomId<TBase extends AnyConstructor>(
	Base: TBase,
	label: string,
) {
	return class extends Base {
		// biome-ignore lint/suspicious/noExplicitAny: typed per concrete subclass
		_run?: (interaction: any, data: any) => unknown;
		_baseCustomId?: string;
		_customId?: string;

		setCustomId(customId: string): this {
			this._baseCustomId = customId;
			this._customId = customId;
			super.setCustomId(customId);
			return this;
		}

		_setData(data: unknown, ttl?: number): this {
			if (!this._baseCustomId) {
				throw new Error(
					`${label} customId must be set before calling setData(). Use .setCustomId(id) first.`,
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
					`${label} customId is not defined. Use .setCustomId(id) before registering the ${label.toLowerCase()}.`,
				);
			}
			return this._customId;
		}

		get baseCustomId(): string {
			if (!this._baseCustomId) {
				throw new Error(
					`${label} baseCustomId is not defined. Use .setCustomId(id) before registering the ${label.toLowerCase()}.`,
				);
			}
			return this._baseCustomId;
		}

		static decodeData(customId: string): {
			baseId: string;
			data: unknown;
			expired: boolean;
		} {
			return decodeCustomIdHelper(customId);
		}
	};
}
