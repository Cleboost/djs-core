import { Events } from "discord.js";
import BotClient from "../class/BotClient";

export function eventListener(client: BotClient) {
  client.on(Events.InteractionCreate, (interaction) => {
    if (interaction.isContextMenuCommand()) return;
    if (interaction.isCommand()) {
      client.handlers.commands.eventCommand(interaction)
      return client.handlers.subCommands.eventSubCommand(interaction);
    }
    if (interaction.isAutocomplete()) return;
  });
}
