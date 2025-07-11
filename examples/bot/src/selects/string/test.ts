import { SelectMenu } from "djs-core";

export default new SelectMenu()
  .setCustomId("test")
  .run((_client, interaction) => {
    const choice = interaction.values[0];
    interaction.reply("You selected: " + choice);
  });