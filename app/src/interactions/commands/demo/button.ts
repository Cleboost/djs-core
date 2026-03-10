import subdemo from "@components/buttons/demo/subdemo";
import { Command } from "@djs-core/runtime";
import { ActionRowBuilder, type ButtonBuilder, MessageFlags } from "discord.js";

export default new Command()
	.setDescription("Demo button command")
	.run(async (interaction) => {
		return interaction.reply({
			content: "Demo button",
			flags: [MessageFlags.Ephemeral],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					subdemo.setData(
						{
							coucou: new Date().toISOString(),
						},
						60,
					),
				),
			],
		});
	});
