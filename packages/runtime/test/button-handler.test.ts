import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Button } from "@djs-core/runtime";
import { testButton } from "@djs-core/testing";

describe("ButtonHandler", () => {
	beforeEach(() => {
		process.env.NODE_ENV = "test";
	});

	test("should route button interaction without data", async () => {
		const executed = mock(() => {});
		const button = new Button().setCustomId("test-btn").run(executed);

		await testButton(button, { viaHandler: true });
		expect(executed).toHaveBeenCalled();
	});

	test("should route button interaction with data", async () => {
		const executed = mock((_, data) => {
			expect(data).toEqual({ id: 1 });
		});
		const button = new Button<{ id: number }>()
			.setCustomId("data-btn")
			.run(executed);

		await testButton(button, { data: { id: 1 }, viaHandler: true });
		expect(executed).toHaveBeenCalled();
	});

	test("should handle expired interaction data", async () => {
		const button = new Button().setCustomId("expired-btn").run(() => {});

		const res = await testButton(button, {
			viaHandler: true,
			customId: "expired-btn:invalid",
		});
		expect(res.repliedWith).toContain("expired");
	});
});
