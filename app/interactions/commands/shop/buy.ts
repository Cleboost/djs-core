import { Command } from "@djs-core/runtime";

export default new Command()
.setDescription('Buy a product')
.run(async (client, interaction) => {
    await interaction.reply('You bought a product');
});