import { Command } from "@djs-core/runtime";
export default new Command()
	.setDescription("Ping the bot")
	.run(async (_client, interaction) => {
		await interaction.reply("Ponfgggg!");
	});
