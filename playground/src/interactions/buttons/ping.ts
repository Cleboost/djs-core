/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Button } from "djs-core";

export default new Button().setCustomId("ping").run((client, interaction) => {
  interaction.reply("I am a fucking ping button");
});
