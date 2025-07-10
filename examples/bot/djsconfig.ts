import { GatewayIntentBits } from "discord.js";
 
export default {
  token: process.env.TOKEN ?? "", // To be overridden in .env
  intents: [GatewayIntentBits.Guilds],
  // Add your test server ID here for immediate deployment,
  // or leave empty for global deployment (which takes longer).
  guildIds: ["861553974728327168"],
} as const; 