/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { CommandMiddleware } from "djs-core";

//Try to do most speed as possible because this function is called for each command
export default new CommandMiddleware().run(async (inteaction) => {
  if (inteaction.commandName === "ping") {
    await inteaction.reply("Pong! from middleware");
    return false; // To prevent the command from being executed
  }
  return true; // To allow the command to be executed
});
