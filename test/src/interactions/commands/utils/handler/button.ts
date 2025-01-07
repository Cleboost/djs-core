import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { SubCommand } from "djs-core";

export default new SubCommand().run((client, interaction) => {
	interaction.reply({
		content: "I am a fucking ping button",
		components: [new ActionRowBuilder<ButtonBuilder>().addComponents([new ButtonBuilder().setCustomId("ping").setLabel("Ping").setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId("sub:ping").setLabel("Ping Subfolder").setStyle(ButtonStyle.Secondary)])],
	});
});
