import { Command } from "@djs-core/runtime";

export default new Command()
	.setDescription("Ping the bot")
	.run(async (interaction) => {
		const message = interaction.client.demo.sayHello();
		await interaction.reply(`Pong! ${message}`);
	});
