import type { Client } from "discord.js";
import type { BaseEvent } from "./BaseEvent";
import type { Command } from "./Command";

/**
 * Register commands and events on a `Client` Discord.
 * Used by the auto-generated handler file at build.
 */
export function registerHandlers(options: {
  client: Client;
  commands?: Command[];
  events?: BaseEvent[];
}) {
  const { client, commands = [], events = [] } = options;

  for (const evt of events) {
    const method = evt.once ? client.once.bind(client) : client.on.bind(client);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore –  args type couverte par BaseEvent generic
    method(evt.eventName, (...args: unknown[]) => evt.execute(client, ...args));
  }

  const commandMap = new Map<string, Command>();
  (client as any)._djsCommands = commandMap;
  for (const cmd of commands) {
    commandMap.set(cmd.name, cmd);
    cmd.register?.(client);
  }

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const cmd = commandMap.get(interaction.commandName);
    if (!cmd) return;
    try {
      await cmd.execute(interaction);
    } catch (err) {
      console.error(`Error in the command ${cmd.name}:`, err);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: "An error occurred…", ephemeral: true });
      } else {
        await interaction.reply({ content: "An error occurred…", ephemeral: true });
      }
    }
  });
} 