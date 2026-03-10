import { Command } from "@djs-core/runtime";

export default new Command()
	.setDescription("Ping the bot")
	.run(async (interaction) => {
		const result = interaction.client.sql.execute("SELECT 1 as val");
		const message = interaction.client.demo.sayHello();
		await interaction.reply(
			`Pong! ${message}. SQL Test: ${JSON.stringify(result)}`,
		);
	});
