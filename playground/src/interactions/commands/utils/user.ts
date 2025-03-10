/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Command } from "djs-core";

export default new Command()
  .setName("user")
  .setDescription("user!")
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to get information about"),
  )
  .run((client, inteaction) => {
    const user = inteaction.options.getUser("user");
    inteaction.reply(`The user you mentioned is ${user?.tag || "unknown"}`);
  });
