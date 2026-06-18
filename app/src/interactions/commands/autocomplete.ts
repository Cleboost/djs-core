import { Command } from "@djs-core/runtime";
import { MessageFlags } from "discord.js";

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
		FRUITS.filter((f) => f.startsWith(value)).map((f) => ({
			name: f,
			value: f,
		})),
	)
	.autocomplete("color", (value) =>
		COLORS.filter((c) => c.startsWith(value)).map((c) => ({
			name: c,
			value: c,
		})),
	)
	.run(async (interaction, options) => {
		await interaction.reply({
			content: `You picked **${options.fruit}** with color **${
				options.color ?? "none"
			}**`,
			flags: [MessageFlags.Ephemeral],
		});
	});
