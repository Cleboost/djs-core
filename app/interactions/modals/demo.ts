import { Modal } from "@djs-core/runtime";
import { LabelBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export default new Modal()
	.setTitle("Demo Modal")
	.addLabelComponents(
		new LabelBuilder()
			.setTextInputComponent(
				new TextInputBuilder()
					.setCustomId("demo")
					.setStyle(TextInputStyle.Short)
					.setRequired(true),
			)
			.setLabel("Demo"),
	)
	.run(async (interaction) => {
		await interaction.reply({ content: interaction.fields.getTextInputValue("demo") });
	});
