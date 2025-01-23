import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { SubCommand } from "djs-core";

export default new SubCommand().run((client, interaction) => {
  const modal = new ModalBuilder()
    .setCustomId("test")
    .setTitle("Test modal")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("input")
          .setPlaceholder("Enter something here")
          .setLabel("Text input")
          .setStyle(TextInputStyle.Short),
      ),
    );

  interaction.showModal(modal);
});
