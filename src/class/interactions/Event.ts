/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Events } from "discord.js";
import BotClient from "../BotClient";

type EventRunFn = (client: BotClient, ...args: unknown[]) => unknown;

export default class EventListner {
  private runFn?: EventRunFn;
  private event: Events | null = null;

  constructor() {}

  setEvent(event: Events) {
    this.event = event;
    return this;
  }

  run(fn: EventRunFn) {
    this.runFn = fn;
    return this;
  }

  /**
   * @private
   * DO NOT USE
   * Internal method to execute the function
   */
  execute(client: BotClient, ...args: unknown[]) {
    if (this.runFn) {
      this.runFn(client, ...args);
    } else {
      client.logger.error(
        `The event ${this.event ? this.event.toString() : "unknown"} has no function to execute!`,
      );
    }
  }

  getEvent() {
    return this.event;
  }
}
