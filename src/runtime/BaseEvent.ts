import type { Client } from "discord.js";

/**
 * Base class for a Discord event listener.
 */
export abstract class BaseEvent<T extends keyof ClientEvents = keyof ClientEvents> {
  /** Exact name of the Discord.js event, ex. "ready", "interactionCreate" */
  abstract readonly eventName: T;

  /** If true ⇒ listener registered once (`client.once`) */
  readonly once: boolean = false;

  /** Logic executed when the event occurs. */
  abstract execute(client: Client, ...args: ClientEvents[T]): Promise<void> | void;
}

// Necessary to type correctly `ClientEvents`
import type { ClientEvents } from "discord.js"; 