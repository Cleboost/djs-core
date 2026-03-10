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
	plugins?: DjsPlugin<any, any, any>[];
	pluginsConfig?: Record<string, any>;
}
