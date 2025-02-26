import { Events } from "discord.js";
import BotClient from "../class/BotClient";

export function eventListener(client: BotClient) {
  client.on(Events.InteractionCreate, (interaction) => {
    if (interaction.isContextMenuCommand()) return;
    if (interaction.isCommand()) {
      client.handlers.commands.eventCommand(interaction);
      client.handlers.subCommands.eventSubCommand(interaction);
      return;
    }
    if (interaction.isAutocomplete()) return;
    if (interaction.isModalSubmit()) return client.handlers.modals.event(interaction);
  });
}
