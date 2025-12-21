import demo from "@components/selects/string/demo";
import { Command } from "@djs-core/runtime";
import { ActionRowBuilder, type StringSelectMenuBuilder } from "discord.js";

export default new Command()
	.setDescription("A demo command that shows how to use a select menu")
	.run(async (interaction) => {
		await interaction.reply({
			content: "Hello, worlld!",
			components: [
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
					demo.setData({ text: "Hello, world! from command" }).addOptions([
						{ label: "Option 1", value: "option1" },
						{ label: "Option 2", value: "option2" },
						{ label: "Option 3s", value: "option3" },
					]),
				),
			],
		});
	});
