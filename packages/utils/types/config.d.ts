import type {
	BitFieldResolvable,
	GatewayIntentsString,
	InteractionContextType,
	Partials,
} from "discord.js";
import type { PluginsConfigMap } from "../../runtime/Plugin";

// biome-ignore lint/suspicious/noExplicitAny: generic plugin array
export interface Config<P extends readonly any[] = any[]> {
	token: string;
	servers: string[];
	intents?: BitFieldResolvable<GatewayIntentsString, number>;
	partials?: Partials[];
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
