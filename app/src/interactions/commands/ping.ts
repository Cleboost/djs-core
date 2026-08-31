import { Command } from "@djs-core/runtime";
import { sql } from "#db";

export default new Command()
	.setDescription("Ping the bot")
	.run(async (interaction) => {
		const val = await interaction.client.db.get(sql`SELECT 1 as val`);
		const message = interaction.client.demo.sayHello();
		await interaction.reply(
			`Pong! ${message}. DB Test: ${JSON.stringify(val)}`,
		);
	});
