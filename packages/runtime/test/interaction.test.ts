import { describe, expect, test } from "bun:test";
import { InteractionHelper } from "../interaction/BaseInteraction";

describe("Interaction Logic", () => {
	test("InteractionHelper.decodeCustomId should decode simple IDs", () => {
		const result = InteractionHelper.decodeCustomId("my-button");
		expect(result.baseId).toBe("my-button");
		expect(result.data).toBeUndefined();
	});

	test("InteractionHelper.decodeCustomId should decode IDs with tokens", () => {
		const data = { userId: "123" };
		const token = InteractionHelper.storeData(data);
		const customId = `my-button:${token}`;

		const result = InteractionHelper.decodeCustomId(customId);
		expect(result.baseId).toBe("my-button");
		expect(result.data).toEqual(data);
	});

	test("InteractionHelper.decodeCustomId should handle invalid tokens", () => {
		const result = InteractionHelper.decodeCustomId("my-button:invalid-token");
		expect(result.baseId).toBe("my-button");
		expect(result.data).toBeUndefined();
	});
});
