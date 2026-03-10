import { demoPlugin } from "@djs-core/plugin-demo";
import { defineConfig } from "@djs-core/runtime";
import { InteractionContextType } from "discord.js";

if (!process.env.TOKEN) {
	throw new Error("TOKEN environment variable is required");
}

const config = defineConfig({
	token: process.env.TOKEN,
	servers: ["1333211545920077896"],
	commands: {
		defaultContext: [InteractionContextType.Guild],
	},
	experimental: {
		cron: true,
		userConfig: true,
	},
	plugins: [demoPlugin],
	pluginsConfig: {
		demo: {
			message: "yoyo",
		},
	},
});

export default config;
export type AppConfig = typeof config;
