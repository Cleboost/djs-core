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
import CommandMiddleware from "../class/middlewares/CommandMiddleware";
import Modal from "../class/interactions/Modal";
import { pathToFileURL } from "node:url";

export default class ModalHandler extends Handler {
  private middleware: Array<CommandMiddleware> = [];
  async load() {
    // this.middleware = this.client.middlewares.filter((middleware: unknown) => middleware instanceof CommandMiddleware) as Array<CommandMiddleware>;

    /* eslint-disable no-async-promise-executor */
    return new Promise<void>(async (resolve) => {
      const selectDir = path.join(process.cwd(), "interactions", "modals");
      if (!fs.existsSync(selectDir)) return resolve();
      for (const modal of fs.readdirSync(selectDir)) {
        if (!modal.endsWith(".js")) continue;
        const modalClass = (
          await import(pathToFileURL(path.join(selectDir, modal)).href)
        ).default.default;
        if (!(modalClass instanceof Modal)) {
          this.client.logger.error(
            `The modal ${underline(`${modal}`)} is not correct!`,
          );
          continue;
        }

        const customID = modalClass.getCustomId();
        if (!customID || typeof customID !== "string") {
          this.client.logger.error(
            `The modal  ${underline(`${modal}`)} has no customId!`,
          );
          continue;
        }
        if (this.collection.has(customID)) {
          this.client.logger.warn(
            `The modal  ${underline(`${modal}:${modalClass.getCustomId()}`)} is already loaded! Skipping...`,
          );
          continue;
        }
        this.collection.set(customID, modalClass);
      }
      resolve();
      this.event();
    });
  }

  async event() {
    this.client.on(
      Events.InteractionCreate,
      async (interaction: Interaction) => {
        if (!interaction.isModalSubmit()) return;
        // for (const middleware of this.middleware) {
        // 	if (!middleware.execute(interaction)) return;
        // }

        const select = this.collection.get(interaction.customId) as
          | Modal
          | undefined;

        if (!select)
          return interaction.reply({
            content: "This modal is not available",
            flags: [MessageFlags.Ephemeral],
          });
        select.execute(this.client, interaction);
        // if (this.client.config?.logger?.log) this.client.logger.info(`Modal ${underline(interaction.customId)} used by ${interaction.user.username} (${interaction.user.id})`);
      },
    );
  }
}
