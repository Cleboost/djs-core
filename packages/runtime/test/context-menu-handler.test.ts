import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ApplicationCommandType, Client } from "discord.js";
import ContextMenuHandler from "../handler/ContextMenuHandler";
import ContextMenu from "../interaction/ContextMenu";

function makeClient(): Client {
	const client = new Client({ intents: [] });
	// Simulate a ready client with a mock application
	Object.defineProperty(client, "isReady", { value: () => true });
	Object.defineProperty(client, "application", {
		value: {
			commands: {
				create: mock(() => Promise.resolve()),
				fetch: mock(() => Promise.resolve(new Map())),
				delete: mock(() => Promise.resolve()),
			},
		},
	});
	return client;
}

describe("ContextMenuHandler", () => {
	let handler: ContextMenuHandler;

	beforeEach(() => {
		handler = new ContextMenuHandler(makeClient());
	});

	test("should route user context menu interaction", async () => {
		const executed = mock(() => {});
		const menu = new ContextMenu().setName("Info").run(executed).withType(ApplicationCommandType.User);
		handler.set([menu]);

		await handler.onContextMenuInteraction({
			commandName: "Info",
			isUserContextMenuCommand: () => true,
			isMessageContextMenuCommand: () => false,
		} as any);
		expect(executed).toHaveBeenCalled();
	});

	test("should route message context menu interaction", async () => {
		const executed = mock(() => {});
		const menu = new ContextMenu().setName("Quote").run(executed).withType(ApplicationCommandType.Message);
		handler.set([menu]);

		await handler.onContextMenuInteraction({
			commandName: "Quote",
			isUserContextMenuCommand: () => false,
			isMessageContextMenuCommand: () => true,
		} as any);
		expect(executed).toHaveBeenCalled();
	});

	test("should ignore unknown context menu", async () => {
		await handler.onContextMenuInteraction({
			commandName: "Ghost",
			isUserContextMenuCommand: () => true,
			isMessageContextMenuCommand: () => false,
		} as any);
		// No crash = pass
	});

	test("set() replaces all context menus", async () => {
		const executed = mock(() => {});
		const a = new ContextMenu().setName("A").run(executed).withType(ApplicationCommandType.User);
		const b = new ContextMenu().setName("B").run(() => {}).withType(ApplicationCommandType.User);
		handler.set([a, b]);
		handler.set([a]);

		await handler.onContextMenuInteraction({
			commandName: "A",
			isUserContextMenuCommand: () => true,
			isMessageContextMenuCommand: () => false,
		} as any);
		expect(executed).toHaveBeenCalled();

		// B was replaced out
		const executedB = mock(() => {});
		await handler.onContextMenuInteraction({
			commandName: "B",
			isUserContextMenuCommand: () => true,
			isMessageContextMenuCommand: () => false,
		} as any);
		expect(executedB).not.toHaveBeenCalled();
	});
});
