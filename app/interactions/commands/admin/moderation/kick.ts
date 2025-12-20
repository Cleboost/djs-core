import { Command } from "@djs-core/runtime";
export default new Command()
	.setDescription("Kick a user")
	.run(async (_client, interaction) => {
		await interaction.reply("Pong!");
	});
