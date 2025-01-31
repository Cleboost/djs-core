/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Handler } from "./Handler";
import path from "path";
import fs from "node:fs";
import { Events, Interaction } from "discord.js";
import Button from "../class/interactions/Button";
import { pathToFileURL } from "node:url";
import { underline } from "chalk";

export default class ButtonHandler extends Handler {
  // private middleware: Array<CommandMiddleware> = [];
  async load() {
    // this.middleware = this.client.middlewares.filter((middleware: unknown) => middleware instanceof CommandMiddleware) as Array<CommandMiddleware>;

    /* eslint-disable no-async-promise-executor */
    return new Promise<void>(async (resolve) => {
      const buttonsDir = path.join(process.cwd(), "interactions", "buttons");
      if (!fs.existsSync(buttonsDir)) return resolve();
      for (const button of fs.readdirSync(buttonsDir)) {
        if (fs.lstatSync(path.join(buttonsDir, button)).isDirectory()) {
          for (const buttonInSub of fs.readdirSync(
            path.join(buttonsDir, button),
          )) {
            const buttonClass = (
              await import(
                pathToFileURL(path.join(buttonsDir, button, buttonInSub)).href
              )
            ).default.default;
            if (!(buttonClass instanceof Button)) {
              this.client.logger.error(
                `The button ${underline(`${button}/${buttonInSub}`)} is not correct!`,
              );
              continue;
            }

            if (this.collection.has(`${button}:${buttonClass.getCustomId()}`)) {
              this.client.logger.warn(
                `The button ${underline(`${button}:${buttonClass.getCustomId()}`)} is already loaded! Skipping...`,
              );
              continue;
            }

            this.collection.set(
              `${button}:${buttonClass.getCustomId()}`,
              buttonClass,
            );
          }
        }

        if (!button.endsWith(".js")) continue;
        const cmd = (await import(pathToFileURL(path.join(buttonsDir, button)).href)).default.default;
        if (!(cmd instanceof Button)) {
          this.client.logger.error(
            `The button ${underline(button)} is not correct!`,
          );
          continue;
        }
        const customID = cmd.getCustomId();
        if (!customID) {
          this.client.logger.error(
            `The button ${underline(button)} has no customId!`,
          );
          continue;
        }

        if (this.collection.has(customID)) {
          this.client.logger.warn(
            `The button ${underline(customID)} is already loaded! Skipping...`,
          );
          continue;
        }

        this.collection.set(customID, cmd);
      }
      resolve();
      return this.event();
    });
  }

  async event() {
    this.client.on(
      Events.InteractionCreate,
      async (interaction: Interaction) => {
        if (!interaction.isButton()) return;
        // for (const middleware of this.middleware) {
        // 	if (!middleware.execute(interaction)) return;
        // }
        const button: Button | undefined = this.collection.get(
          interaction.customId,
        ) as Button | undefined;
        if (!button) return;
        button.execute(this.client, interaction);
        if (this.client.config?.logger?.logBtn)
          this.client.logger.info(
            `Button ${underline(interaction.customId)} used by ${interaction.user.username} (${interaction.user.id})`,
          );
      },
    );
  }
}
