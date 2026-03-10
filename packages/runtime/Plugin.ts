import type { Client, InteractionContextType } from "discord.js";

/**
 * Definition of a djs-core plugin.
 */
export interface DjsPlugin<
	Name extends string = string,
	Config = any,
	Extension = any,
> {
	name: Name;
	setup: (client: Client, config: Config) => Extension | Promise<Extension>;
	onReady?: (
		client: Client,
		config: Config,
		extension: Extension,
	) => void | Promise<void>;
}

/**
 * Helper to define a djs-core plugin with full type inference.
 */
export function definePlugin<Name extends string, Config, Extension>(
	plugin: DjsPlugin<Name, Config, Extension>,
): DjsPlugin<Name, Config, Extension> {
	return plugin;
}

/**
 * Basic djs-core configuration.
 */
interface CoreConfig {
	token: string;
	servers: string[];
	commands?: {
		defaultContext?: InteractionContextType[];
	};
	experimental?: {
		cron?: boolean;
		userConfig?: boolean;
	};
}

type ExtractPluginConfig<P> = P extends DjsPlugin<any, infer C, any> ? C : never;

export type PluginsConfigMap<P extends DjsPlugin<any, any, any>[]> = {
	[K in P[number] as K["name"]]?: ExtractPluginConfig<K>;
};

/**
 * Helper to define djs-core configuration with plugin type inference.
 */
export function defineConfig<const P extends DjsPlugin<any, any, any>[]>(
	config: CoreConfig & {
		plugins?: P;
		pluginsConfig?: PluginsConfigMap<P>;
	},
): CoreConfig & {
	plugins?: P;
	pluginsConfig?: PluginsConfigMap<P>;
} {
	return config;
}
