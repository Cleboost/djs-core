/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { ModalSubmitInteraction } from "discord.js";

/**
 * fn
 * @type {Function} - Function to execute
 * @param {ModalSubmitInteraction} interaction - The interaction to check
 * @returns {boolean} - Return true if accepted event, false otherwise
 * @public
 */

type fn = (interaction: ModalSubmitInteraction) => Promise<boolean>;

export default class ModalMiddleware {
  private fn: fn | null = null;
  constructor() {}

  run(fn: fn) {
    this.fn = fn;
    return this;
  }

  /**
   * @private
   * DO NOT USE
   * Internal method to execute the function
   */
  execute(interaction: ModalSubmitInteraction): Promise<boolean> {
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
