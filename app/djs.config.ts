import { demoPlugin } from "@djs-core/plugin-demo";
import { defineConfig } from "@djs-core/runtime";
import {IntentsBitField, InteractionContextType} from "discord.js";

if (!process.env.TOKEN) {
	throw new Error("TOKEN environment variable is required");
}

const config = defineConfig({
	token: process.env.TOKEN,
	servers: ["1333211545920077896"],
	commands: {
		defaultContext: [InteractionContextType.Guild],
	},
	intents: [
		IntentsBitField.Flags.MessageContent,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildPresences
	],
	experimental: {
		cron: true,
		userConfig: true,
	},
	plugins: [
		import("@djs-core/plugin-sql"),
		demoPlugin,
		import("@djs-core/plugin-prisma-sqlite"),
	],
	pluginsConfig: {
		demo: {
			message: "yoyo",
		},
		prisma: {},
		sql: {
			path: "todos.db",
		},
	},
});

export default config;
export type AppConfig = typeof config;
