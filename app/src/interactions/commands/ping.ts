import { sql } from "@djs-core/db";
import { Command } from "@djs-core/runtime";

export default new Command()
	.setDescription("Ping the bot")
	.run(async (interaction) => {
		const [result] = await interaction.client.db
			.select({ val: sql<number>`1` })
			.limit(1);
		const message = interaction.client.demo.sayHello();
		await interaction.reply(
			`Pong! ${message}. DB Test: ${JSON.stringify(result)}`,
		);
	});
