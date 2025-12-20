import { Command } from "@djs-core/runtime";
export default new Command()
	.setDescription("Ping the bot")
	.run(async (client, interaction) => {
		await interaction.reply("Pong!");
	});
