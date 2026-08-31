import { describe, expect, test } from "bun:test";
import {
	closeDataStore,
	getInteractionData,
	storeInteractionData,
} from "../store/DataStore";

describe("DataStore", () => {
	test("should store and retrieve data", () => {
		const token = "test-token";
		const data = { foo: "bar" };

		storeInteractionData(token, data);
		const result = getInteractionData(token);

		expect(result).not.toBeNull();
		expect(result?.expired).toBe(false);
		expect(result?.data).toEqual(data);
	});

	test("should return null for non-existent token", () => {
		const result = getInteractionData("ghost");
		expect(result).toBeNull();
	});

	test("should handle expiration", () => {
		const token = "expiring-token";
		const data = { old: true };

		storeInteractionData(token, data, 1);
		const result = getInteractionData(token);

		expect(result).not.toBeNull();
		expect(result?.expired).toBe(false);
		expect(result?.data).toEqual(data);
	});

	test("cleanup", () => {
		closeDataStore();
	});
});
