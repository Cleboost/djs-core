import { Button } from "@djs-core/runtime";
import { ButtonStyle, MessageFlags } from "discord.js";

export default new Button()
	.setLabel("Subdemo button")
	.setStyle(ButtonStyle.Primary)
	.run(async (_client, interaction) => {
		return interaction.reply({
			content: "Subdemo button",
			flags: [MessageFlags.Ephemeral],
		});
	});
