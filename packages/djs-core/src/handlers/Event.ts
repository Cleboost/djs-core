/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { ClientEvents } from "discord.js";
import BotClient from "../class/BotClient";
import EventListener from "../class/interactions/Event";

export default class EventHandler {
  private events: Map<
    keyof ClientEvents,
    { instance: EventListener; handler: (...args: unknown[]) => unknown }
  > = new Map();
  private client: BotClient;

  constructor(client: BotClient) {
    this.client = client;
  }

  addEvent(event: EventListener) {
    const evt = event.getEvent();
    if (!evt) {
      return this.client.logger.warn(`Un événement n'a pas d'événement défini`);
    }
    const handler = (...args: unknown[]) => event.execute(this.client, ...args);
    this.client.on(evt as keyof ClientEvents, handler);
    this.events.set(evt as keyof ClientEvents, { instance: event, handler });
  }

  removeEvent(event: keyof ClientEvents) {
    const data = this.events.get(event);
    if (!data) {
      return this.client.logger.warn(
        `L'événement ${event} n'est pas enregistré`,
      );
    }
    this.client.off(event, data.handler);
    this.events.delete(event);
  }

  reloadEvent(event: keyof ClientEvents) {
    const data = this.events.get(event);
    if (!data) {
      return this.client.logger.warn(
        `L'événement ${event} n'est pas enregistré`,
      );
    }
    this.client.off(event, data.handler);
    const newHandler = (...args: unknown[]) =>
      data.instance.execute(this.client, ...args);
    this.client.on(event, newHandler);
    this.events.set(event, { instance: data.instance, handler: newHandler });
  }
}
