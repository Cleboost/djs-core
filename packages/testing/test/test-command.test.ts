import { beforeEach, describe, expect, test } from "bun:test";
import { Command } from "@djs-core/runtime";
import { testCommand } from "../index";

describe("testCommand", () => {
	beforeEach(() => {
		process.env.NODE_ENV = "test";
	});

	test("captures reply content", async () => {
		const command = new Command()
			.setName("ping")
			.setDescription("Ping")
			.run(async (interaction) => {
				await interaction.reply("Pong!");
			});

		const res = await testCommand(command);
		expect(res.repliedWith).toBe("Pong!");
		expect(res.replies).toHaveLength(1);
		expect(res.replies[0]?.method).toBe("reply");
	});

	test("passes command options", async () => {
		const command = new Command()
			.setName("echo")
			.setDescription("Echo")
			.addStringOption((opt) =>
				opt.setName("msg").setDescription("Message").setRequired(true),
			)
			.run(async (interaction, options) => {
				await interaction.reply(String(options.msg));
			});

		const res = await testCommand(command, { options: { msg: "hello" } });
		expect(res.repliedWith).toBe("hello");
	});

	test("supports deferReply and editReply", async () => {
		const command = new Command()
			.setName("slow")
			.setDescription("Slow")
			.run(async (interaction) => {
				await interaction.deferReply();
				await interaction.editReply("done");
			});

		const res = await testCommand(command);
		expect(res.deferred).toBe(true);
		expect(res.repliedWith).toBe("done");
	});

	test("routes via handler when viaHandler is true", async () => {
		const command = new Command()
			.setName("user")
			.setDescription("User")
			.run(async (interaction) => {
				await interaction.reply("sub");
			});

		const res = await testCommand(command, {
			viaHandler: true,
			route: "config.user",
		});
		expect(res.repliedWith).toBe("sub");
	});

	test("uses client extensions from opts", async () => {
		const command = new Command()
			.setName("plugin")
			.setDescription("Plugin")
			.run(async (interaction) => {
				const demo = interaction.client.demo as { sayHello: () => string };
				await interaction.reply(demo.sayHello());
			});

		const res = await testCommand(command, {
			client: { demo: { sayHello: () => "hi" } },
		});
		expect(res.repliedWith).toBe("hi");
	});

	test("auto-stubs client.db and plugins by default", async () => {
		const command = new Command()
			.setName("ping")
			.setDescription("Ping")
			.run(async (interaction) => {
				const val = await interaction.client.db.get(null);
				const plugin = (
					interaction.client.demo as { sayHello: () => string }
				).sayHello();
				await interaction.reply(`Pong! ${plugin} ${JSON.stringify(val)}`);
			});

		const res = await testCommand(command);
		expect(res.repliedWith).toContain("Pong!");
		expect(res.repliedWith).toContain("test");
		expect(res.repliedWith).toContain('"val":1');
	});
});
