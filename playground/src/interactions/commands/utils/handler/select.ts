/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { SubCommand } from "djs-core";

export default new SubCommand().run((client, interaction) => {
  interaction.reply({
    content: "I am a fucking ping button",
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder().setCustomId("string:test").addOptions([
          {
            label: "Option 1",
            value: "option1",
          },
          {
            label: "Option 2",
            value: "option2",
          },
        ]),
      ),
    ],
  });
});
