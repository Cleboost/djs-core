import { BotClient } from "djs-core";
import { config } from "dotenv";

config();

const client = new BotClient();
console.log("Client created");
client.start(process.env.TOKEN);

export default client;
