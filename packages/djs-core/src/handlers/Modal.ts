/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Collection, MessageFlags, ModalSubmitInteraction } from "discord.js";
import Modal from "../class/interactions/Modal";
import { underline } from "chalk";
import BotClient from "../class/BotClient";

export default class ModalHandler {
  private modals = new Collection<string, Modal>();
  private client: BotClient;
  constructor(client: BotClient) {
    this.client = client;
  }

  addInteraction(modal: Modal) {
    if (this.modals.has(modal.getCustomId())) {
      this.client.logger.warn(
        `The modal ${underline(modal.getCustomId())} is already loaded! Skipping...`,
      );
      return;
    }
    return this.modals.set(modal.getCustomId(), modal);
  }

  removeInteraction(modal: Modal) {
    if (!this.modals.has(modal.getCustomId())) {
      this.client.logger.warn(
        `The modal ${underline(modal.getCustomId())} is not loaded! Skipping...`,
      );
      return;
    }
    this.modals.delete(modal.getCustomId());
    return;
  }

  reloadInteraction(modal: Modal) {
    if (!this.modals.has(modal.getCustomId())) {
      this.client.logger.warn(
        `The modal ${underline(modal.getCustomId())} is not loaded! Adding instead...`,
      );
      this.addInteraction(modal);
      return;
    }
    this.removeInteraction(modal);
    this.addInteraction(modal);
    return;
  }

  async event(interaction: ModalSubmitInteraction) {
    const modal = this.modals.get(interaction.customId);
    if (!modal)
      return interaction.reply({
        content: "This modal is not available",
        flags: [MessageFlags.Ephemeral],
      });
    modal.execute(this.client, interaction);
    if (this.client.config?.logger?.logModal)
      this.client.logger.info(
        `Modal ${underline(interaction.customId)} used by ${interaction.user.username} (${interaction.user.id})`,
      );
    // this.client.on(
    //   Events.InteractionCreate,
    //   async (interaction: Interaction) => {
    //     if (!interaction.isModalSubmit()) return;
    //     for (const middleware of this.middleware) {
    //       if (!(await middleware.execute(interaction))) return;
    //     }
    //     const select = this.collection.get(interaction.customId) as
    //       | Modal
    //       | undefined;

    //     if (!select)
    //       return interaction.reply({
    //         content: "This modal is not available",
    //         flags: [MessageFlags.Ephemeral],
    //       });
    //     select.execute(this.client, interaction);
    //     // if (this.client.config?.logger?.) this.client.logger.info(`Modal ${underline(interaction.customId)} used by ${interaction.user.username} (${interaction.user.id})`);
    //   },
    // );
  }
}
