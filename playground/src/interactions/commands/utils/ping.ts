import { Command } from "djs-core";

export default new Command()
  .setName("ping")
  .setDescription("Pong!")
  .run((client, inteaction) => {
    inteaction.reply("Pong! salut");
  });
