import { Client, MessageFlags } from "discord.js";
import type { BaseEvent } from "./Class/BaseEvent";
import type { Command } from "./Class/Command";
import type { Button } from "./Class/Button";

export function registerHandlers(options: {
  client: Client;
  commands?: Command[];
  events?: BaseEvent[];
  buttons?: Button[];
}) {
  const { client, commands = [], events = [], buttons = [] } = options;

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

  const buttonMap = new Map<string, Button>();
  (client as any)._djsButtons = buttonMap;
  for (const btn of buttons) {
    buttonMap.set(btn.customId, btn);
    btn.register?.(client);
  }

  client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
      const cmd = commandMap.get(interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction);
      } catch (err) {
        console.error(`Error in the command ${cmd.name}:`, err);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: "An error occurred…", flags: MessageFlags.Ephemeral });
        } else {
          await interaction.reply({ content: "An error occurred…", flags: MessageFlags.Ephemeral });
        }
      }
    } else if (interaction.isButton()) {
      const btn = buttonMap.get(interaction.customId);
      if (!btn) return;
      try {
        await btn.execute(interaction);
      } catch (err) {
        console.error(`Error in the button handler for ${interaction.customId}:`, err);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: "An error occurred…", flags: MessageFlags.Ephemeral });
        } else {
          await interaction.reply({ content: "An error occurred…", flags: MessageFlags.Ephemeral });
        }
      }
    }
  });

  client.on("ready", () => {
    console.log(`Logged in as ${client.user?.tag}`);
  });
} 