import { StringSelectMenu } from "@djs-core/runtime";

export default new StringSelectMenu()
	.withData<{ text: string }>()
	.run(
	async (interaction, data) => {
		await interaction.reply({
			content: `${interaction.values[0]} ${data.text}`,
		});
	},
);
