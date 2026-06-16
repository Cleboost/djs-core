import { randomBytes } from "crypto";
import { getInteractionData, storeInteractionData } from "../store/DataStore";

/**
 * Generates a unique token and stores the data.
 * @returns The token.
 */
export function storeInteractionDataHelper(
	data: unknown,
	ttl?: number,
): string {
	const tokenBytes = randomBytes(16);
	const token = tokenBytes
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");

	storeInteractionData(token, data, ttl);
	return token;
}

/**
 * Decodes a custom ID that may contain a data token.
 * Format: "baseId:token" or just "baseId"
 */
export function decodeCustomIdHelper(customId: string): {
	baseId: string;
	data: unknown;
	expired: boolean;
} {
	const lastColonIndex = customId.lastIndexOf(":");
	if (lastColonIndex === -1) {
		return { baseId: customId, data: undefined, expired: false };
	}

	const baseId = customId.slice(0, lastColonIndex);
	const token = customId.slice(lastColonIndex + 1);

	if (!token) {
		return { baseId: customId, data: undefined, expired: false };
	}

	const result = getInteractionData(token);

	if (result === null) {
		return { baseId, data: undefined, expired: false };
	}

	return { baseId, data: result.data, expired: result.expired };
}

/**
 * Shared logic for interactions with persistent data.
 */
export const InteractionHelper = {
	storeData: storeInteractionDataHelper,
	decodeCustomId: decodeCustomIdHelper,
};
