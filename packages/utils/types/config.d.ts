import type { InteractionContextType } from "discord.js";
import type { DjsPlugin } from "../../runtime/Plugin";

export interface Config {
	token: string;
	servers: string[];
	commands?: {
		defaultContext?: InteractionContextType[];
	};
	experimental?: {
		cron?: boolean;
		userConfig?: boolean;
	};
	// biome-ignore lint/suspicious/noExplicitAny: generic plugin array
	plugins?: DjsPlugin<string, any, any>[];
	// biome-ignore lint/suspicious/noExplicitAny: generic plugin config
	pluginsConfig?: Record<string, any>;
}
