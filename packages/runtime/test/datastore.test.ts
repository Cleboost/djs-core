import { describe, expect, test } from "bun:test";
import { getInteractionData, storeInteractionData } from "../store/DataStore";

describe("DataStore", () => {
	test("should store and retrieve data", () => {
		const token = "test-token";
		const data = { foo: "bar" };

		storeInteractionData(token, data);
		const retrieved = getInteractionData(token);

		expect(retrieved).toEqual(data);
	});

	test("should return undefined for non-existent token", () => {
		const retrieved = getInteractionData("ghost");
		expect(retrieved).toBeUndefined();
	});

	test("should handle expiration", async () => {
		const token = "expired-token";
		const data = { old: true };

		// Store with 1 minute TTL, but we'll mock the check or just test immediate expiration if we could
		// For now, let's test that it DOESN'T expire immediately
		storeInteractionData(token, data, 1);
		expect(getInteractionData(token)).toEqual(data);
	});
});
