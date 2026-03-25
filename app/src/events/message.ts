import { EventListener } from "@djs-core/runtime";
import { Events } from "discord.js";

export default new EventListener()
	.event(Events.MessageCreate)
	.run(async (_client, message) => {
		if (message.author.bot) return;
		console.log(message.content);
	});
