/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Handler } from "./Handler";
import path from "path";
import fs from "node:fs";
import { ClientEvents} from "discord.js";
import { underline } from "kolorist";
import { pathToFileURL } from "node:url";
import EventListner from "../class/interactions/Event";

export default class EventHandler extends Handler {
  async load() {
    /* eslint-disable no-async-promise-executor */
    return new Promise<void>(async (resolve) => {
      const eventsDir = path.join(process.cwd(), "events");
      if (!fs.existsSync(eventsDir)) return resolve();
      for (const eventFile of fs.readdirSync(eventsDir)) {
        const event = (await import(pathToFileURL(path.join(eventsDir, eventFile)).href)).default.default;
        if (!(event instanceof EventListner)) {
          this.client.logger.error(
            `The event ${underline(eventFile)} is not correct!`,
          );
          continue;
        }

        if (event.getEvent()) {
          const eventName = event.getEvent();
          if (eventName) {
            this.client.on(eventName as keyof ClientEvents, (...args: unknown[]) => {
              return event.execute(this.client, ...args);
            });
          } else {
            this.client.logger.error("The event has no event to listen to!");
          }
        } else {
          this.client.logger.error("The event has no event to listen to!");
        }
      }
      resolve();
    });
  }
}
