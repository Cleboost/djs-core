/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Command } from "djs-core";

export default new Command()
  .setName("autocomplete")
  .setDescription("This is an autocomplete command")
  .addStringOption((option) =>
    option
      .setName("input")
      .setDescription("This is an input")
      .setAutocomplete(true)
      .setRequired(true),
  )
  .run((client, interaction) => {
    const input = interaction.options.getString("input");
    return interaction.reply(`You selected ${input}`);
  })
  .autoComplete((client, interaction) => {
    return interaction.respond([
      { name: "Option 1", value: "option1" },
      { name: "Option 2", value: "option2" },
      { name: "Option 3", value: "option3" },
    ]);
  });
