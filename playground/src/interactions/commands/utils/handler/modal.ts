/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { SubCommand } from "djs-core";

export default new SubCommand()
  .setName("modal")
  .setParent("handler")
  .setDescription("Create modal")
  .run((client, interaction) => {
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
