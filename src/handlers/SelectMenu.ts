/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Handler } from "./Handler";
import path from "path";
import fs from "node:fs";
import { Events, Interaction, MessageFlags } from "discord.js";
import { underline } from "kolorist";
// import CommandMiddleware from "../class/middlewares/CommandMiddleware";
import SelectMenu from "../class/interactions/SelectMenu";
import { pathToFileURL } from "node:url";

export default class SelectMenuHandler extends Handler {
  // private middleware: Array<CommandMiddleware> = [];
  async load() {
    // this.middleware = this.client.middlewares.filter((middleware: unknown) => middleware instanceof CommandMiddleware) as Array<CommandMiddleware>;

    /* eslint-disable no-async-promise-executor */
    return new Promise<void>(async (resolve) => {
      const selectDir = path.join(process.cwd(), "interactions", "selects");
      if (!fs.existsSync(selectDir)) return resolve();
      for (const selectType of fs.readdirSync(selectDir)) {
        for (const selectMenu of fs.readdirSync(
          path.join(selectDir, selectType),
        )) {
          if (!selectMenu.endsWith(".js")) continue;
          const selectMenuClass = (await import(pathToFileURL(path.join(selectDir, selectType, selectMenu)).href)).default.default;
          if (!(selectMenuClass instanceof SelectMenu)) {
            this.client.logger.error(
              `The select menu ${underline(`${selectType}/${selectMenu}`)} is not correct!`,
            );
            continue;
          }

          const customID = selectMenuClass.getCustomId();
          if (!customID || typeof customID !== "string") {
            this.client.logger.error(
              `The select menu  ${underline(`${selectType}/${selectMenu}`)} has no customId!`,
            );
            continue;
          }
          if (this.collection.has(customID)) {
            this.client.logger.warn(
              `The select menu  ${underline(`${selectType}:${selectMenuClass.getCustomId()}`)} is already loaded! Skipping...`,
            );
            continue;
          }
          this.collection.set(customID, selectMenuClass);
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
        if (!interaction.isAnySelectMenu()) return;
        // for (const middleware of this.middleware) {
        // 	if (!middleware.execute(interaction)) return;
        // }
        const select = this.collection.get(interaction.customId) as
          | SelectMenu
          | undefined;

        if (!select)
          return interaction.reply({
            content: "This select menu is not available",
            flags: [MessageFlags.Ephemeral],
          });
        select.execute(this.client, interaction);
        if (this.client.config?.logger?.logSelect)
          this.client.logger.info(
            `Select menu ${underline(interaction.customId)} used by ${interaction.user.username} (${interaction.user.id})`,
          );
      },
    );
  }
}
