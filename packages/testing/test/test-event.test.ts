import { describe, expect, test } from "bun:test";
import { EventListener } from "@djs-core/runtime";
import { Events } from "discord.js";
import { testEvent } from "../index";

describe("testEvent", () => {
	test("invokes listener with args", async () => {
		let seen = "";
		const listener = new EventListener()
			.event(Events.ClientReady)
			.run(async (client) => {
				seen = client.user?.username ?? "";
			});

		await testEvent(listener, {
			client: { user: { username: "Bot" } },
		});
		expect(seen).toBe("Bot");
	});

	test("passes event args through", async () => {
		let content = "";
		const listener = new EventListener()
			.event(Events.MessageCreate)
			.run(async (_client, message) => {
				content = (message as { content: string }).content;
			});

		await testEvent(listener, {
			args: [{ content: "hello" }],
		});
		expect(content).toBe("hello");
	});
});
