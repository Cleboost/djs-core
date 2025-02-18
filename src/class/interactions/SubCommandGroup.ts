/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { SlashCommandBuilder } from "discord.js";

export default class SubCommandGroup extends SlashCommandBuilder {
  constructor() {
    super();
  }

  getDiscordCommand() {
    return this.toJSON();
  }
}
