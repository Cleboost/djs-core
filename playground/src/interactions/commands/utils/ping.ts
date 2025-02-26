/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Command } from "djs-core";

export default new Command()
  .setName("ping")
  .setDescription("Pong!")
  .run((client, inteaction) => {
    inteaction.reply("Pong! salut");
  });
