import { describe, expect, mock, test } from "bun:test";
import { InteractionHelper } from "../interaction/BaseInteraction";
import Command from "../interaction/Command";

describe("Interaction Logic", () => {
	test("InteractionHelper.decodeCustomId should decode simple IDs", () => {
		const result = InteractionHelper.decodeCustomId("my-button");
		expect(result.baseId).toBe("my-button");
		expect(result.data).toBeUndefined();
	});

	test("InteractionHelper.decodeCustomId should decode IDs with tokens", () => {
		const data = { userId: "123" };
		const token = InteractionHelper.storeData(data);
		const customId = `my-button:${token}`;

		const result = InteractionHelper.decodeCustomId(customId);
		expect(result.baseId).toBe("my-button");
		expect(result.data).toEqual(data);
	});

	test("InteractionHelper.decodeCustomId should handle invalid tokens", () => {
		const result = InteractionHelper.decodeCustomId("my-button:invalid-token");
		expect(result.baseId).toBe("my-button");
		expect(result.data).toBeUndefined();
	});
});

describe("Command autocomplete", () => {
	test("truncates choices to 25 and warns", async () => {
		const warnSpy = mock(() => {});
		const originalWarn = console.warn;
		console.warn = warnSpy;
		process.env.NO_COLOR = "1";

		try {
			const command = new Command()
				.setName("search")
				.setDescription("search")
				.addStringOption((opt) =>
					opt.setName("q").setDescription("query").setAutocomplete(true),
				)
				.autocomplete("q", async () =>
					Array.from({ length: 30 }, (_, i) => ({
						name: `choice-${i}`,
						value: String(i),
					})),
				)
				.run(async () => {});

			let respondedWith: unknown[] = [];
			const interaction = {
				options: {
					getFocused: () => ({ name: "q", value: "a" }),
				},
				respond: async (choices: unknown[]) => {
					respondedWith = choices;
				},
			};

			await command.executeAutocomplete(interaction as never);

			expect(respondedWith).toHaveLength(25);
			expect(warnSpy).toHaveBeenCalled();
			expect(String(warnSpy.mock.calls[0]?.[0])).toContain(
				"returned 30 choices",
			);
		} finally {
			console.warn = originalWarn;
			delete process.env.NO_COLOR;
		}
	});
});
