import { BotClient } from "djs-core";
import { config } from "dotenv";

config();

const client = new BotClient();
client.start(process.env.TOKEN);

export default client;
