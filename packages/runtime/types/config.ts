import type { DbConfig } from "@djs-core/db";
import type {
	BitFieldResolvable,
	GatewayIntentsString,
	InteractionContextType,
	Partials,
} from "discord.js";
import type { PluginsConfigMap } from "../Plugin";

// biome-ignore lint/suspicious/noExplicitAny: generic plugin array
export interface Config<P extends readonly any[] = any[]> {
	token: string;
	servers: string[];
	/** Defaults to `Guilds` only. Add intents your bot actually needs. */
	intents?: BitFieldResolvable<GatewayIntentsString, number>;
	/** Defaults to none. Opt in when listening to partial gateway payloads. */
	partials?: Partials[];
	commands?: {
		defaultContext?: InteractionContextType[];
	};
	experimental?: {
		cron?: boolean;
		userConfig?: boolean;
		bundle?: boolean;
	};
	db?: DbConfig;
	plugins?: P;
	pluginsConfig?: PluginsConfigMap<P>;
}
