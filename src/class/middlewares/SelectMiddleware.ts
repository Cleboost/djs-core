/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { AnySelectMenuInteraction } from "discord.js";

/**
 * fn
 * @type {Function} - Function to execute
 * @param {AnySelectMenuInteraction} interaction - The interaction to check
 * @returns {boolean} - Return true if accepted event, false otherwise
 * @public
 */

type fn = (interaction: AnySelectMenuInteraction) => Promise<boolean>;

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
  execute(interaction: AnySelectMenuInteraction): Promise<boolean> {
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
