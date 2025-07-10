import { Command } from "djs-core";

export default new Command()
  .setName("ping")
  .setDescription("Répond avec pong!")
  .run((_client, interaction) => {
    interaction.reply("Pong! 🏓");
  }); 