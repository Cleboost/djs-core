import type { Client } from "discord.js";

export abstract class BaseEvent<T extends keyof ClientEvents = keyof ClientEvents> {
  abstract readonly eventName: T;
  readonly once: boolean = false;
  abstract execute(client: Client, ...args: ClientEvents[T]): Promise<void> | void;
}

import type { ClientEvents } from "discord.js"; 