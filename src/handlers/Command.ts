/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Handler } from "./Handler";
import path from "path";
import fs from "node:fs";
import Command from "../class/interactions/Command";
import SubCommandGroup from "../class/interactions/SubCommandGroup";
import { Events, Interaction } from "discord.js";
import { underline } from "kolorist";
import CommandMiddleware from "../class/middlewares/CommandMiddleware";

export default class CommandHandler extends Handler {
  private middleware: Array<CommandMiddleware> = [];
  async load() {
    this.middleware = this.client.middlewares.filter(
      (middleware: unknown) => middleware instanceof CommandMiddleware,
    ) as Array<CommandMiddleware>;

    /* eslint-disable no-async-promise-executor */
    return new Promise<void>(async (resolve) => {
      const commands = path.join(process.cwd(), "interactions", "commands");
      if (!fs.existsSync(commands)) return resolve();
      for (const categories of fs.readdirSync(commands)) {
        for (const command of fs
          .readdirSync(path.join(commands, categories))
          .filter((file) => file.endsWith(".js"))) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const cmd = require(path.join(commands, categories, command)).default;
          if (cmd instanceof SubCommandGroup) continue;
          if (!(cmd instanceof Command)) {
            this.client.logger.error(
              `The command ${underline(`${categories}/${command}`)} is not correct!`,
            );
            continue;
          }
          if (this.collection.has(cmd.name)) {
            this.client.logger.warn(
              `The command ${underline(cmd.name)} is already loaded! Skipping...`,
            );
            continue;
          }
          this.collection.set(cmd.name, cmd);
        }
      }
      resolve();
      this.event();
    });
  }

  async event() {
    this.client.on(
      Events.InteractionCreate,
      async (interaction: Interaction) => {
        if (!interaction.isCommand()) return;
        if (interaction.isContextMenuCommand()) return;
        if (interaction.options.getSubcommand(false)) return;
        for (const middleware of this.middleware) {
          if (!middleware.execute(interaction)) return;
        }
        const command: Command = this.collection.get(
          interaction.commandName,
        ) as Command;
        if (!command) return;
        command.execute(this.client, interaction);
        if (this.client.config?.logger?.logCmd)
          this.client.logger.info(
            `Command ${underline(interaction.commandName)} used  by ${interaction.user.username} (${interaction.user.id})`,
          );
      },
    );
  }
}
