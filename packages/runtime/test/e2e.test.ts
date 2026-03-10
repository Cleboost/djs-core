import { beforeAll, describe, expect, mock, test } from "bun:test";
import { Events } from "discord.js";
import { resolve } from "path";
import { runBot } from "../../dev/utils/common";

describe("E2E Integration (Ready to Prod)", () => {
	let bot: any;

	beforeAll(async () => {
		process.env.NODE_ENV = "test";
		process.env.TOKEN = "mock-token";
		process.env.GUILD_ID = "1234567890";
		process.env.SKIP_SYNC = "true";

		const DjsClient = (await import("../DjsClient")).default;
		DjsClient.prototype.login = mock(() => Promise.resolve("mock-token"));
		DjsClient.prototype.isReady = () => true;

		const projectPath = resolve(process.cwd(), "app");
		bot = (await runBot(projectPath)) as any;

		// Mock user to prevent crash in ready event
		bot.client.user = {
			id: "1234567890",
			tag: "MockBot#0000",
			setActivity: mock(() => ({})),
		};

		bot.client.emit(Events.ClientReady, bot.client);
		await new Promise((resolve) => setTimeout(resolve, 100));
	});

	test("should have loaded all commands from app/", () => {
		const routes = bot.client.commandsHandler.getRoutes();
		expect(routes.length).toBeGreaterThan(0);
		expect(
			routes.find((r: any) => r.route === "ping"),
		).toBeDefined();
	});

	test("should execute ping command flow", async () => {
		const reply = mock(() => Promise.resolve());
		const interaction = {
			commandName: "ping",
			client: bot.client,
			options: {
				getSubcommandGroup: () => null,
				getSubcommand: () => null,
			},
			isRepliable: () => true,
			replied: false,
			deferred: false,
			reply,
		} as any;

		await bot.client.commandsHandler.onCommandInteraction(interaction);
		expect(reply).toHaveBeenCalled();
	});

	test("should handle button flow from demo", async () => {
		const interaction = {
			commandName: "demo",
			client: bot.client,
			options: {
				getSubcommandGroup: () => null,
				getSubcommand: () => "button",
			},
			isRepliable: () => true,
			replied: false,
			deferred: false,
			reply: mock(() => Promise.resolve()),
		} as any;

		await bot.client.commandsHandler.onCommandInteraction(interaction);
		expect(interaction.reply).toHaveBeenCalled();

		const { InteractionHelper } = await import(
			"../interaction/BaseInteraction"
		);
		const token = InteractionHelper.storeData({ coucou: "test" });

		const buttonInteraction = {
			customId: `demo.subdemo:${token}`,
			client: bot.client,
			isRepliable: () => true,
			replied: false,
			deferred: false,
			reply: mock(() => Promise.resolve()),
		} as any;

		await bot.client.buttonsHandler.onButtonInteraction(buttonInteraction);
		expect(buttonInteraction.reply).toHaveBeenCalled();
	});
});
