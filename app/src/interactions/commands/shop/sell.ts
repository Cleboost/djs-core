import { Command } from "@djs-core/runtime";

export default new Command()
	.setDescription("Sell a product")
	.run(async (interaction) => {
		await interaction.reply("You sold a product");
	});
