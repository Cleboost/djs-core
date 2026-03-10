import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { handleInteractionError } from "../utils/error";

describe("Interaction Error Handler", () => {
	let originalError: typeof console.error;

	beforeEach(() => {
		originalError = console.error;
		console.error = mock(() => {});
	});

	afterEach(() => {
		console.error = originalError;
	});

	test("should call reply if not already replied", async () => {
		const reply = mock(() => Promise.resolve());
		const interaction = {
			isRepliable: () => true,
			replied: false,
			deferred: false,
			reply,
		} as any;

		await handleInteractionError(interaction, new Error("Test error"));
		expect(reply).toHaveBeenCalled();
	});

	test("should call followUp if already replied", async () => {
		const followUp = mock(() => Promise.resolve());
		const interaction = {
			isRepliable: () => true,
			replied: true,
			deferred: false,
			followUp,
		} as any;

		await handleInteractionError(interaction, new Error("Test error"));
		expect(followUp).toHaveBeenCalled();
	});

	test("should do nothing if not repliable", async () => {
		const interaction = {
			isRepliable: () => false,
		} as any;

		await handleInteractionError(interaction, new Error("Test error"));
		// No crash means success
	});
});
