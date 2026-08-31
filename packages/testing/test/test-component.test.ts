import { beforeEach, describe, expect, test } from "bun:test";
import { Button, Modal, StringSelectMenu } from "@djs-core/runtime";
import { testButton, testModal, testSelectMenu } from "../index";

describe("testButton", () => {
	beforeEach(() => {
		process.env.NODE_ENV = "test";
	});

	test("executes button without data", async () => {
		const button = new Button()
			.setCustomId("test-btn")
			.run(async (interaction) => {
				await interaction.reply("clicked");
			});

		const res = await testButton(button);
		expect(res.repliedWith).toBe("clicked");
	});

	test("passes decoded data", async () => {
		const button = new Button<{ id: number }>()
			.setCustomId("data-btn")
			.run(async (_interaction, data) => {
				await _interaction.reply(`id=${data.id}`);
			});

		const res = await testButton(button, { data: { id: 42 } });
		expect(res.repliedWith).toBe("id=42");
	});

	test("routes expired token via handler", async () => {
		const button = new Button()
			.setCustomId("expired-btn")
			.run(async (interaction) => {
				await interaction.reply("ok");
			});

		const res = await testButton(button, {
			viaHandler: true,
			customId: "expired-btn:invalid",
		});
		expect(res.repliedWith).toContain("expired");
	});
});

describe("testModal", () => {
	beforeEach(() => {
		process.env.NODE_ENV = "test";
	});

	test("reads modal field values", async () => {
		const modal = new Modal()
			.setCustomId("form")
			.setTitle("Form")
			.run(async (interaction) => {
				const value = interaction.fields.getTextInputValue("name");
				await interaction.reply(value);
			});

		const res = await testModal(modal, { fields: { name: "grug" } });
		expect(res.repliedWith).toBe("grug");
	});
});

describe("testSelectMenu", () => {
	beforeEach(() => {
		process.env.NODE_ENV = "test";
	});

	test("passes selected values", async () => {
		const menu = new StringSelectMenu()
			.setCustomId("pick")
			.addOptions([{ label: "A", value: "a" }])
			.run(async (interaction) => {
				await interaction.reply(interaction.values.join(","));
			});

		const res = await testSelectMenu(menu, { values: ["a"] });
		expect(res.repliedWith).toBe("a");
	});
});
