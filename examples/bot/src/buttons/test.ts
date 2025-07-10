import { MessageFlags } from "discord.js";
import { Button } from "djs-core";

export default new Button()
  .setCustomID("test")
  .run((_client, interaction) => {
    interaction.reply({ content: "Button 'test' clicked!", flags: MessageFlags.Ephemeral });
  });
