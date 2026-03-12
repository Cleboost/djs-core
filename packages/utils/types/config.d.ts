import type { InteractionContextType } from "discord.js";
import type { PluginsConfigMap } from "../../runtime/Plugin";

// biome-ignore lint/suspicious/noExplicitAny: generic plugin array
export interface Config<P extends readonly any[] = any[]> {
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
