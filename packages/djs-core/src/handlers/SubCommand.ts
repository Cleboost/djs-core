/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Handler } from "./Handler";
import SubCommandGroup from "../class/interactions/SubCommandGroup";
import { ChatInputCommandInteraction } from "discord.js";
import SubCommand from "../class/interactions/SubCommand";
import { underline } from "chalk";
import { pushToApi } from "./loader";

export default class SubCommandHandler extends Handler {
  private subCommands = new Map<string, SubCommand>();
  private subCommandGroupe: SubCommandGroup[] = [];
  async addSubCommandGroup(subCommandGroup: SubCommandGroup) {
    if (this.subCommands.has(subCommandGroup.name)) {
      this.client.logger.warn(
        `The subcommand ${underline(subCommandGroup.name)} is already loaded! Skipping...`,
      );
      return;
    }
    return this.subCommandGroupe.push(subCommandGroup);
  }

  async addSubCommand(subCommand: SubCommand) {
    if (this.subCommands.has(`${subCommand.getParent()}.${subCommand.name}`)) {
      this.client.logger.warn(
        `The subcommand ${underline(subCommand.name)} is already loaded! Skipping...`,
      );
      return;
    }

    return this.subCommands.set(
      `${subCommand.getParent()}.${subCommand.name}`,
      subCommand,
    );
  }

  async removeSubCommand(subCommand: SubCommand) {
    if (!this.subCommands.has(`${subCommand.getParent()}.${subCommand.name}`)) {
      this.client.logger.warn(
        `The subcommand ${underline(subCommand.name)} is not loaded! Skipping...`,
      );
      return;
    }
    return this.subCommands.delete(
      `${subCommand.getParent()}.${subCommand.name}`,
    );
  }

  async reloadSubCommand(subCommand: SubCommand) {
    const existingSubCommand = Array.from(this.subCommands.values()).find(
      (cmd: SubCommand) => cmd.name === subCommand.name,
    );

    if (!existingSubCommand) {
      this.client.logger.warn(
        `The subcommand ${underline(subCommand.name)} is not loaded! Adding instead...`,
      );
      this.addSubCommand(subCommand);
      return pushToApi(this.client);
    }

    if (existingSubCommand.name !== subCommand.name) {
      this.client.logger.info(
        `The subcommand ${underline(subCommand.name)} is not loaded! Adding instead...`,
      );
      this.addSubCommand(subCommand);
      return pushToApi(this.client);
    }

    if (existingSubCommand.name === subCommand.name) {
      this.removeSubCommand(subCommand);
      return this.addSubCommand(subCommand);
    }
  }

  async eventSubCommand(interaction: ChatInputCommandInteraction) {
    if (interaction.isAutocomplete() || interaction.isContextMenuCommand())
      return;
    if (!("options" in interaction)) return;
    if (!interaction.options.getSubcommand(false)) return;
    const subCommand: SubCommand | unknown = this.subCommands.get(
      `${interaction.commandName}.${interaction.options.getSubcommand()}`,
    );
    if (!subCommand || !(subCommand instanceof SubCommand))
      // return this.client.logger.error(
      //   `SubCommand ${interaction.options.getSubcommand()} not found`,
      // );
      return this.client.logger.error(
        new Error(
          `SubCommand ${interaction.options.getSubcommand()} not found`,
        ),
      );

    if (interaction.isChatInputCommand()) {
      subCommand.execute(this.client, interaction);
    }
  }

  listSubCommands(): SubCommandGroup[] {
    return this.subCommandGroupe.map((subCommandGroup) => {
      const subCommands = Array.from(this.subCommands.values()).filter(
        (subCommand: SubCommand) =>
          subCommand.getParent || "" === subCommandGroup.name,
      );
      for (const subCommand of subCommands) {
        subCommandGroup.addSubcommand(subCommand);
      }
      return subCommandGroup;
    });
  }
}
