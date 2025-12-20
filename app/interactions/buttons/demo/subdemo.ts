import { Button } from "@djs-core/runtime";
import { ButtonStyle, MessageFlags } from "discord.js";

export default new Button<{ coucou: string }>()
	.setLabel("Subdemo button")
	.setStyle(ButtonStyle.Primary)
	.run(async (_client, interaction, data) => {
		return interaction.reply({
			content: `Subdemo button ${data.coucou}`,
			flags: [MessageFlags.Ephemeral],
		});
	});
