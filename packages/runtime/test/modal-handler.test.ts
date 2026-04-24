import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Client } from "discord.js";
import ModalHandler from "../handler/ModalHandler";
import Modal from "../interaction/Modal";

describe("ModalHandler", () => {
	let client: Client;
	let handler: ModalHandler;

	beforeEach(() => {
		process.env.NODE_ENV = "test"; // Use in-memory DB
		client = new Client({ intents: [] });
		handler = new ModalHandler(client);
	});

	describe("registration", () => {
		test("should add a modal", async () => {
			const modal = new Modal().setCustomId("test-modal").run(() => {});
			handler.add(modal);
			// Verify it was added by triggering it with a fake interaction
			const executed = mock(() => {});
			modal.run(executed);

			const interaction = {
				customId: "test-modal",
			} as any;

			await handler.onModalSubmit(interaction);
			expect(executed).toHaveBeenCalled();
		});

		test("should set multiple modals", async () => {
			const modal1 = new Modal().setCustomId("test-modal-1").run(() => {});
			const modal2 = new Modal().setCustomId("test-modal-2").run(() => {});

			handler.set([modal1, modal2]);

			const executed1 = mock(() => {});
			const executed2 = mock(() => {});
			modal1.run(executed1);
			modal2.run(executed2);

			await handler.onModalSubmit({ customId: "test-modal-1" } as any);
			await handler.onModalSubmit({ customId: "test-modal-2" } as any);

			expect(executed1).toHaveBeenCalled();
			expect(executed2).toHaveBeenCalled();
		});

		test("should delete a modal", async () => {
			const modal = new Modal().setCustomId("test-modal").run(() => {});
			handler.add(modal);
			handler.delete("test-modal");

			const executed = mock(() => {});
			modal.run(executed);

			const interaction = {
				customId: "test-modal",
			} as any;

			await handler.onModalSubmit(interaction);
			expect(executed).not.toHaveBeenCalled();
		});
	});

	describe("interaction routing", () => {
		test("should route modal interaction without data", async () => {
			const executed = mock(() => {});
			const modal = new Modal().setCustomId("test-modal").run(executed);

			handler.add(modal);

			const interaction = {
				customId: "test-modal",
			} as any;

			await handler.onModalSubmit(interaction);
			expect(executed).toHaveBeenCalled();
		});

		test("should route modal interaction with data", async () => {
			const executed = mock((_, data) => {
				expect(data).toEqual({ id: 1 });
			});
			const modal = new Modal<{ id: number }>()
				.setCustomId("data-modal")
				.run(executed);

			handler.add(modal);

			const { InteractionHelper } = await import("../interaction/BaseInteraction");
			const token = InteractionHelper.storeData({ id: 1 });
			const interaction = {
				customId: `data-modal:${token}`,
			} as any;

			await handler.onModalSubmit(interaction);
			expect(executed).toHaveBeenCalled();
		});

		test("should handle expired interaction data", async () => {
			const modal = new Modal().setCustomId("expired-modal").run(() => {});
			handler.add(modal);

			const reply = mock(() => {});
			const interaction = {
				customId: "expired-modal:invalid",
				reply,
			} as any;

			await handler.onModalSubmit(interaction);
			expect(reply).toHaveBeenCalled();
		});
	});

	describe("error handling", () => {
		test("should handle errors during execution", async () => {
			const originalConsoleError = console.error;
			console.error = mock(() => {}); // suppress expected error log

			const modal = new Modal()
				.setCustomId("error-modal")
				.run(() => {
					throw new Error("Test error");
				});
			handler.add(modal);

			const reply = mock(() => {});
			const interaction = {
				customId: "error-modal",
				reply,
				isRepliable: () => true,
				replied: false,
				deferred: false,
			} as any;

			await handler.onModalSubmit(interaction);

			expect(reply).toHaveBeenCalled();
			expect(console.error).toHaveBeenCalled();

			console.error = originalConsoleError;
		});
	});
});
