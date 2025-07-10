export const commandTpl = (name: string, description: string) => `
import { Command } from "djs-core";

export default new Command()
  .setName("${name}")
  .setDescription("${description}")
  .run((_client, interaction) => {
    // TODO: implement the command logic
    interaction.reply("${description}");
  });
`;