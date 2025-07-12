export const contextMenuTpl = (name: string, type: "USER" | "MESSAGE") => `
import { ApplicationCommandType, MessageFlags } from "discord.js";
import { ContextMenu } from "djs-core";

export default new ContextMenu()
  .setName("${name}")
  .setType(ApplicationCommandType.${type})
  .run((_client, interaction) => {
    // TODO: implémenter la logique du contexte menu
    interaction.reply({ content: "${name} triggered!", flags: [MessageFlags.Ephemeral] });
  });
`; 