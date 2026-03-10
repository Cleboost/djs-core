import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Client } from "discord.js";
import ButtonHandler from "../handler/ButtonHandler";
import { InteractionHelper } from "../interaction/BaseInteraction";
import Button from "../interaction/Button";

describe("ButtonHandler", () => {
	let client: Client;
	let handler: ButtonHandler;

	beforeEach(() => {
		process.env.NODE_ENV = "test"; // Use in-memory DB
		client = new Client({ intents: [] });
		handler = new ButtonHandler(client);
	});

	test("should route button interaction without data", async () => {
		const executed = mock(() => {});
		const button = new Button().setCustomId("test-btn").run(executed);

		handler.add(button);

		const interaction = {
			customId: "test-btn",
		} as any;

		await handler.onButtonInteraction(interaction);
		expect(executed).toHaveBeenCalled();
	});

	test("should route button interaction with data", async () => {
		const executed = mock((_, data) => {
			expect(data).toEqual({ id: 1 });
		});
		const button = new Button<{ id: number }>()
			.setCustomId("data-btn")
			.run(executed);

		handler.add(button);

		const token = InteractionHelper.storeData({ id: 1 });
		const interaction = {
			customId: `data-btn:${token}`,
		} as any;

		await handler.onButtonInteraction(interaction);
		expect(executed).toHaveBeenCalled();
	});

	test("should handle expired interaction data", async () => {
		const button = new Button().setCustomId("expired-btn").run(() => {});
		handler.add(button);

		const reply = mock(() => {});
		const interaction = {
			customId: "expired-btn:invalid",
			reply,
		} as any;

		await handler.onButtonInteraction(interaction);
		expect(reply).toHaveBeenCalled();
	});
});
