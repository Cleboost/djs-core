/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { ButtonInteraction } from "discord.js";

/**
 * fn
 * @type {Function} - Function to execute
 * @param {CommandInteraction} interaction - The interaction to check
 * @returns {boolean} - Return true if accepted event, false otherwise
 * @public
 */

type fn = (interaction: ButtonInteraction) => Promise<boolean>;

export default class ButtonMiddleware {
  private fn: fn | null = null;
  constructor() {}

  run(fn: fn) {
    this.fn = fn;
    return this;
  }

  execute(interaction: ButtonInteraction) {
    if (this.fn) {
      return this.fn(interaction);
    }
    interaction.reply({
      content: "An error occured",
      ephemeral: true,
    });
    return new Promise((resolve) => resolve(false));
  }
}
