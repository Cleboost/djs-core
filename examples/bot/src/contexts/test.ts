import { ApplicationCommandType, MessageFlags } from "discord.js";
import { ContextMenu } from "djs-core";

export default new ContextMenu()
  .setName("Test Context Menu")
  .setType(ApplicationCommandType.User)
  .run((_client, interaction) => {
    interaction.reply({ content: "Hello!", flags: [MessageFlags.Ephemeral] });
  });
