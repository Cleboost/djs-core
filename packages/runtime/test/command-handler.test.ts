import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Client } from "discord.js";
import CommandHandler from "../handler/CommandHandler";
import Command from "../interaction/Command";

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

		// Mock interaction
		const interaction = {
			commandName: "ping",
			options: {
				getSubcommandGroup: () => null,
				getSubcommand: () => null,
			},
		} as any;

		await handler.onCommandInteraction(interaction);
		expect(executed).toHaveBeenCalled();
	});

	test("should route subcommand", async () => {
		const executed = mock(() => {});
		const command = new Command()
			.setName("user")
			.setDescription("info")
			.run(executed);

		handler.set([{ route: "config.user", command }]);

		// Mock interaction for /config user
		const interaction = {
			commandName: "config",
			options: {
				getSubcommandGroup: () => null,
				getSubcommand: () => "user",
			},
		} as any;

		await handler.onCommandInteraction(interaction);
		expect(executed).toHaveBeenCalled();
	});

	test("should handle missing command gracefully", async () => {
		const originalError = console.error;
		const consoleSpy = mock(() => {});
		console.error = consoleSpy;

		const interaction = {
			commandName: "unknown",
			options: {
				getSubcommandGroup: () => null,
				getSubcommand: () => null,
			},
		} as any;

		await handler.onCommandInteraction(interaction);
		expect(consoleSpy).toHaveBeenCalled();

		console.error = originalError;
	});
});
