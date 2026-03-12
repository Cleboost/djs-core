import type { InteractionContextType } from "discord.js";
import type { DjsPlugin, PluginsConfigMap } from "../../runtime/Plugin";

export interface Config<const P extends readonly any[] = any[]> {
	token: string;
	servers: string[];
	commands?: {
		defaultContext?: InteractionContextType[];
	};
	experimental?: {
		cron?: boolean;
		userConfig?: boolean;
	};
	plugins?: P;
	pluginsConfig?: PluginsConfigMap<P>;
}
