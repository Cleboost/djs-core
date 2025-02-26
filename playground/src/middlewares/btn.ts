/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { ButtonMiddleware } from "djs-core";

export default new ButtonMiddleware().run(async (interaction) => {
  console.log("Just a log from the button middleware");
  console.log(interaction.customId);
  return true;
});
