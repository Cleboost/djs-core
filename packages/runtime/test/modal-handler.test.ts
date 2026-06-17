import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Client } from "discord.js";
import ModalHandler from "../handler/ModalHandler";
import { InteractionHelper } from "../interaction/BaseInteraction";
import Modal from "../interaction/Modal";

describe("ModalHandler", () => {
	let handler: ModalHandler;

	beforeEach(() => {
		process.env.NODE_ENV = "test";
		const client = new Client({ intents: [] });
		handler = new ModalHandler(client);
	});

	test("should route modal submit without data", async () => {
		const executed = mock(() => {});
		const modal = new Modal().setCustomId("my-modal").setTitle("Test").run(executed);
		handler.add(modal);

		await handler.onModalSubmit({ customId: "my-modal" } as any);
		expect(executed).toHaveBeenCalled();
	});

	test("should route modal submit with data", async () => {
		const executed = mock((_, data) => {
			expect(data).toEqual({ step: 2 });
		});
		const modal = new Modal<{ step: number }>()
			.setCustomId("step-modal")
			.setTitle("Step")
			.run(executed);
		handler.add(modal);

		const token = InteractionHelper.storeData({ step: 2 });
		await handler.onModalSubmit({ customId: `step-modal:${token}` } as any);
		expect(executed).toHaveBeenCalled();
	});

	test("should reply with expiry message for invalid token", async () => {
		const modal = new Modal().setCustomId("exp-modal").setTitle("X").run(() => {});
		handler.add(modal);

		const reply = mock(() => {});
		await handler.onModalSubmit({ customId: "exp-modal:badtoken", reply } as any);
		expect(reply).toHaveBeenCalled();
	});

	test("should ignore unknown modal", async () => {
		await handler.onModalSubmit({ customId: "unknown-modal" } as any);
		// No crash = pass
	});

	test("set() replaces all modals", () => {
		const a = new Modal().setCustomId("a").setTitle("A").run(() => {});
		const b = new Modal().setCustomId("b").setTitle("B").run(() => {});
		handler.set([a, b]);
		handler.delete("a");
		// Only b remains — routing b should not crash
		expect(async () =>
			handler.onModalSubmit({ customId: "b" } as any),
		).not.toThrow();
	});
});
