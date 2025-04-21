import { Events, Interaction } from "discord.js";
import BotClient from "../class/BotClient";

export function eventListener(client: BotClient) {
  client.on(Events.InteractionCreate, (interaction: Interaction) => {
    if (interaction.isContextMenuCommand()) {
      client.handlers.contextMenu.eventContextMenu(interaction);
      return;
    }
    if (interaction.isCommand()) {
      client.handlers.commands.eventCommand(interaction);
      client.handlers.subCommands.eventSubCommand(interaction);
      return;
    }
    if (interaction.isAutocomplete()) return;
    if (interaction.isModalSubmit())
      return client.handlers.modals.event(interaction);
    if (interaction.isButton())
      return client.handlers.buttons.event(interaction);
    if (interaction.isAnySelectMenu())
      return client.handlers.selectMenus.event(interaction);
  });
}
