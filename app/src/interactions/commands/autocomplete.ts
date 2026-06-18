import { Command } from "@djs-core/runtime";

const FRUITS = ["apple", "banana", "cherry", "date", "elderberry"];
const COLORS = ["red", "green", "blue", "yellow", "purple"];

export default new Command()
	.setDescription("Autocomplete command")
	.addStringOption((option) =>
		option
			.setName("fruit")
			.setDescription("Pick a fruit")
			.setRequired(true)
			.setAutocomplete(true),
	)
	.addStringOption((option) =>
		option
			.setName("color")
			.setDescription("Pick a color")
			.setAutocomplete(true),
	)
	.autocomplete("fruit", (value) =>
		FRUITS.filter((f) => f.startsWith(value)).map((f) => ({ name: f, value: f })),
	)
	.autocomplete("color", (value) =>
		COLORS.filter((c) => c.startsWith(value)).map((c) => ({ name: c, value: c })),
	)
	.run(async (interaction) => {
		const fruit = interaction.options.getString("fruit", true);
		const color = interaction.options.getString("color") ?? "no color";
		await interaction.reply(`You picked **${fruit}** with color **${color}**`);
	});
