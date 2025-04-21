/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { ApplicationCommandType, MessageFlags } from "discord.js";
import { ContextMenu } from "djs-core";

export default new ContextMenu()
  .setName("Test Context Menu")
  .setType(ApplicationCommandType.User)
  .run((client, interaction) => {
    interaction.reply({
      content: "Hello from the context meenu!",
      flags: [MessageFlags.Ephemeral],
    });
  });
