/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { ModalMiddleware } from "djs-core";

export default new ModalMiddleware().run(async (interaction) => {
  console.log(interaction.id);
  return true;
});
