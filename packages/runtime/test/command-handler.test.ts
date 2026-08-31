import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Command, CommandHandler } from "@djs-core/runtime";
import { createMockChatInputInteraction, testCommand } from "@djs-core/testing";
import { Client } from "discord.js";

describe("CommandHandler", () => {
	let client: Client;
	let handler: CommandHandler;

	beforeEach(() => {
		client = new Client({ intents: [] });
		handler = new CommandHandler(client);
	});

	test("should route simple command", async () => {
		const executed = mock(() => {});
		const command = new Command()
			.setName("ping")
			.setDescription("pong")
			.run(executed);

		handler.set([{ route: "ping", command }]);

		const res = await testCommand(command, {
			viaHandler: true,
			route: "ping",
		});
		expect(executed).toHaveBeenCalled();
		expect(res.repliedWith).toBeNull();
	});

	test("should route subcommand", async () => {
		const executed = mock(() => {});
		const command = new Command()
			.setName("user")
			.setDescription("info")
			.run(executed);

		handler.set([{ route: "config.user", command }]);

		await testCommand(command, {
			viaHandler: true,
			route: "config.user",
		});
		expect(executed).toHaveBeenCalled();
	});

	test("should handle missing command gracefully", async () => {
		const originalError = console.error;
		const consoleSpy = mock(() => {});
		console.error = consoleSpy;

		const interaction = createMockChatInputInteraction({ route: "unknown" });
		await handler.onCommandInteraction(interaction as never);
		expect(consoleSpy).toHaveBeenCalled();

		console.error = originalError;
	});
});
