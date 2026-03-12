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
	/**
	 * Register CLI commands for this plugin.
	 * @param cli The CAC instance.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: generic plugin cli registration
	cli?: (cli: any) => void;
	/**
	 * Run tasks after the plugin is installed.
	 * @param context Postinstall context.
	 */
	postinstall?: (context: { root: string }) => void | Promise<void>;
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
	P extends DjsPlugin<string, infer C, any> ? C : any;

type ExtractPluginExtension<P> =
	// biome-ignore lint/suspicious/noExplicitAny: generic plugin inference
	P extends DjsPlugin<string, any, infer E> ? E : any;

// biome-ignore lint/suspicious/noExplicitAny: generic plugin inference
export type PluginInput = DjsPlugin<any, any, any> | Promise<any> | any;

type UnwrapPlugin<T> = T extends Promise<infer M>
	? M extends { [key: string]: any }
		? { [K in keyof M]: M[K] extends { name: string } ? M[K] : never }[keyof M]
		: any
	: T extends { name: string }
		? T
		: any;

// biome-ignore lint/suspicious/noExplicitAny: generic plugin map
export type PluginsConfigMap<P extends readonly any[]> = {
	[K in P[number] as UnwrapPlugin<K> extends { name: infer N } ? (N extends string ? N : never) : never]?: ExtractPluginConfig<UnwrapPlugin<K>>;
};

// biome-ignore lint/suspicious/noExplicitAny: generic plugin map
export type PluginsExtensionsMap<P extends readonly any[]> =
	{
		[K in P[number] as UnwrapPlugin<K> extends { name: infer N } ? (N extends string ? N : never) : never]: ExtractPluginExtension<UnwrapPlugin<K>>;
	};

/**
 * Interface to be augmented by plugins to add properties to DjsClient.
 */
export interface PluginsExtensions {}

/**
 * Helper to define a djs-core configuration with plugin type inference.
 */

// biome-ignore lint/suspicious/noExplicitAny: generic plugin inference
export function defineConfig<const P extends readonly any[]>(
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
