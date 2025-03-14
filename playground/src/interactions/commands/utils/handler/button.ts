/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { SubCommand } from "djs-core";

export default new SubCommand()
  .setName("button")
  .setParent("handler")
  .setDescription("Create button")
  .run((client, interaction) => {
    interaction.reply({
      content: "I am a fucking ping button",
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents([
          new ButtonBuilder()
            .setCustomId("ping")
            .setLabel("Ping")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("sub:ping")
            .setLabel("Ping Subfolder")
            .setStyle(ButtonStyle.Secondary),
        ]),
      ],
    });
  });
