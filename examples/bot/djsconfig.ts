import { GatewayIntentBits } from "discord.js";
import { SuperDemoPlugin } from "my-super-djs-plugin";
 
export default {
  token: process.env.TOKEN ?? "", // To be overridden in .env
  intents: [GatewayIntentBits.Guilds],
  // Add your test server ID here for immediate deployment,
  // or leave empty for global deployment (which takes longer).
  guildIds: ["861553974728327168"],
  plugins: [SuperDemoPlugin()]
} as const; 