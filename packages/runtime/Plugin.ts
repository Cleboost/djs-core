import type { Client, InteractionContextType } from "discord.js";

/**
 * Definition of a djs-core plugin.
 */
export interface DjsPlugin<
	Name extends string = string,
	// biome-ignore lint/suspicious/noExplicitAny: generic plugin config
	Config = any,
	// biome-ignore lint/suspicious/noExplicitAny: generic plugin extension
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

type ExtractPluginConfig<P> =
	// biome-ignore lint/suspicious/noExplicitAny: generic plugin inference
	P extends DjsPlugin<string, infer C, any> ? C : never;

// biome-ignore lint/suspicious/noExplicitAny: generic plugin map
export type PluginsConfigMap<P extends DjsPlugin<string, any, any>[]> = {
	[K in P[number] as K["name"]]?: ExtractPluginConfig<K>;
};

/**
 * Helper to define djs-core configuration with plugin type inference.
 */
// biome-ignore lint/suspicious/noExplicitAny: generic plugin inference
export function defineConfig<const P extends DjsPlugin<string, any, any>[]>(
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
