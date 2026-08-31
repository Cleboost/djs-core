import { describe, expect, test } from "bun:test";
import { Command, ContextMenu } from "@djs-core/runtime";
import { ApplicationCommandType } from "discord.js";
import { testAutocomplete, testContextMenu } from "../index";

describe("testAutocomplete", () => {
	test("captures respond choices", async () => {
		const command = new Command()
			.setName("search")
			.setDescription("Search")
			.addStringOption((opt) =>
				opt
					.setName("q")
					.setDescription("Query")
					.setRequired(true)
					.setAutocomplete(true),
			)
			.autocomplete("q", async (value) => [{ name: value, value }])
			.run(async () => {});

		const res = await testAutocomplete(command, {
			focused: { name: "q", value: "ping" },
		});
		expect(res.respondedWith).toEqual([{ name: "ping", value: "ping" }]);
	});
});

describe("testContextMenu", () => {
	test("executes user context menu", async () => {
		const menu = new ContextMenu()
			.setName("profile")
			.setType(ApplicationCommandType.User)
			.run(async (interaction) => {
				await interaction.reply(`user:${interaction.targetUser.id}`);
			});

		const res = await testContextMenu(menu, {
			targetUser: { id: "555" },
		});
		expect(res.repliedWith).toBe("user:555");
	});
});
