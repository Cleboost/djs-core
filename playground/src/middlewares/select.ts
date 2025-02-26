/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { SelectMiddleware } from "djs-core";

export default new SelectMiddleware().run(async (interaction) => {
  if (!interaction) return false;
  return true;
});
