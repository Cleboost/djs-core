import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Command } from "djs-core";

export default new Command()
  .setName("button")
  .setDescription("Test button")
  .run((_client, interaction) => {
    interaction.reply({ components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId("test").setLabel("Test").setStyle(ButtonStyle.Primary))] });
  }); 