import { Command } from "@djs-core/runtime";
export default new Command()
	.setDescription("Ping the bot")
	.addStringOption((option) =>
		option
			.setName("type")
			.setDescription("The type of log to export")
			.setRequired(true)
			.addChoices(
				{ name: "All", value: "all" },
				{ name: "User", value: "user" },
				{ name: "Server", value: "server" },
			),
	)
	.run(async (interaction) => {
		await interaction.reply("Pong!");
	});
