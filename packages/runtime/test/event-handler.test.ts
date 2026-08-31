import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { type Client, Events } from "discord.js";
import EventHandler from "../handler/EventHandler";
import EventListener from "../interaction/EventListener";

function createMockClient() {
	const handlers = new Map<string, (...args: unknown[]) => unknown>();
	return {
		handlers,
		on(event: string, fn: (...args: unknown[]) => unknown) {
			handlers.set(event, fn);
		},
		off(event: string, fn: (...args: unknown[]) => unknown) {
			if (handlers.get(event) === fn) handlers.delete(event);
		},
	} as unknown as Client & {
		handlers: Map<string, (...args: unknown[]) => unknown>;
	};
}

describe("EventHandler", () => {
	let originalError: typeof console.error;

	beforeEach(() => {
		process.env.NO_COLOR = "1";
		originalError = console.error;
	});

	afterEach(() => {
		console.error = originalError;
		delete process.env.NO_COLOR;
	});

	test("logs async listener failures instead of unhandled rejections", async () => {
		const client = createMockClient();
		const handler = new EventHandler(client);
		const errorSpy = mock(() => {});
		console.error = errorSpy;

		const listener = new EventListener()
			.event(Events.ClientReady)
			.run(async () => {
				throw new Error("boom");
			});

		handler.add("ready", listener);

		const wrapped = client.handlers.get(Events.ClientReady);
		expect(wrapped).toBeDefined();

		await wrapped?.(client);
		await Bun.sleep(0);

		expect(errorSpy).toHaveBeenCalled();
		const line = String(errorSpy.mock.calls[0]?.[0]);
		expect(line).toContain("Event listener 'ready' failed");
	});

	test("logs sync listener failures", async () => {
		const client = createMockClient();
		const handler = new EventHandler(client);
		const errorSpy = mock(() => {});
		console.error = errorSpy;

		const listener = new EventListener().event(Events.ClientReady).run(() => {
			throw new Error("sync boom");
		});

		handler.add("ready-sync", listener);

		const wrapped = client.handlers.get(Events.ClientReady);
		await wrapped?.(client);

		expect(errorSpy).toHaveBeenCalled();
	});
});
