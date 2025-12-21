import { Command } from "@djs-core/runtime";
import { MessageFlags } from "discord.js";

export default new Command()
	.setDescription("A command with options ! 🔥")
	.addStringOption(option => option.setName("options").setDescription("The fabulous options").setRequired(true))
	.run(async (interaction) => {
		const options = interaction.options.getString("options");
		return interaction.reply({ content: `You chose ${options}!`, flags: [MessageFlags.Ephemeral] });
	});