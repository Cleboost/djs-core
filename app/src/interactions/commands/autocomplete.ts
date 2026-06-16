import { Command } from "@djs-core/runtime";

export default new Command()
	.setDescription("Autocomplete command")
	.addStringOption((option) =>
		option
			.setName("type")
			.setDescription("The type of log to export")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.run(async (interaction) => {
		await interaction.reply("Autocomplete command");
	})
	.runAutocomplete(async (interaction) => {
		return interaction.respond([
			{
				name: new Date().toISOString(),
				value: "now",
			},
		]);
	});
