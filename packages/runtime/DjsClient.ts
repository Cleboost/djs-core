import {
	type AutocompleteInteraction,
	type ButtonInteraction,
	type ChannelSelectMenuInteraction,
	type ChatInputCommandInteraction,
	Client,
	type ContextMenuCommandInteraction,
	Events,
	IntentsBitField,
	type Interaction,
	type MentionableSelectMenuInteraction,
	type ModalSubmitInteraction,
	type RoleSelectMenuInteraction,
	type StringSelectMenuInteraction,
	type UserSelectMenuInteraction,
} from "discord.js";
import type { Config } from "../utils/types/config";
import ApplicationCommandHandler from "./handler/ApplicationCommandHandler";
import ButtonHandler from "./handler/ButtonHandler";
import CommandHandler from "./handler/CommandHandler";
import ContextMenuHandler from "./handler/ContextMenuHandler";
import CronHandler from "./handler/CronHandler";
import EventHandler from "./handler/EventHandler";
import ModalHandler from "./handler/ModalHandler";
import SelectMenuHandler from "./handler/SelectMenuHandler";
import type {
	DjsPlugin,
	PluginsExtensions,
	PluginsExtensionsMap,
} from "./Plugin";

export class DjsClient<
	UserConfig = unknown,
	// biome-ignore lint/suspicious/noExplicitAny: generic plugin array
	Plugins extends readonly any[] = any[],
> extends Client {
	public eventsHandler: EventHandler = new EventHandler(this);
	public commandsHandler: CommandHandler = new CommandHandler(this);
	public buttonsHandler: ButtonHandler = new ButtonHandler(this);
	public contextMenusHandler: ContextMenuHandler = new ContextMenuHandler(this);
	public selectMenusHandler: SelectMenuHandler = new SelectMenuHandler(this);
  public modalsHandler: ModalHandler = new ModalHandler(this);
	// biome-ignore lint/suspicious/noExplicitAny: handler initialization
	public applicationCommandHandler: ApplicationCommandHandler = new ApplicationCommandHandler(this as any);
	public cronHandler: CronHandler = new CronHandler(this);
	private readonly djsConfig: Config<Plugins>;
	public readonly config?: UserConfig;
	private pluginInitPromise: Promise<void>;

	constructor({
		djsConfig,
		userConfig,
	}: { djsConfig: Config<Plugins>; userConfig?: UserConfig }) {
		super({
			intents: [
				IntentsBitField.Flags.Guilds,
				IntentsBitField.Flags.GuildMessages,
				IntentsBitField.Flags.GuildMessageReactions,
				IntentsBitField.Flags.GuildVoiceStates,
			],
		});
		this.djsConfig = djsConfig;
		this.config = userConfig as UserConfig;

		this.pluginInitPromise = this.initPlugins();

		if (djsConfig.servers && djsConfig.servers.length > 0) {
			this.commandsHandler.setGuilds(djsConfig.servers);
			this.contextMenusHandler.setGuilds(djsConfig.servers);
			this.applicationCommandHandler.setGuilds(djsConfig.servers);
		}

		this.on(Events.InteractionCreate, (interaction: Interaction) => {
			if (interaction.isAutocomplete()) {
				this.commandsHandler.onAutocompleteInteraction(
					interaction as AutocompleteInteraction,
				);
			}
			if (interaction.isCommand()) {
				this.commandsHandler.onCommandInteraction(
					interaction as ChatInputCommandInteraction,
				);
			}
			if (interaction.isButton()) {
				this.buttonsHandler.onButtonInteraction(
					interaction as ButtonInteraction,
				);
			}
			if (interaction.isContextMenuCommand()) {
				this.contextMenusHandler.onContextMenuInteraction(
					interaction as ContextMenuCommandInteraction,
				);
			}
			if (
				interaction.isStringSelectMenu() ||
				interaction.isUserSelectMenu() ||
				interaction.isRoleSelectMenu() ||
				interaction.isChannelSelectMenu() ||
				interaction.isMentionableSelectMenu()
			) {
				this.selectMenusHandler.onSelectMenuInteraction(
					interaction as
						| StringSelectMenuInteraction
						| UserSelectMenuInteraction
						| RoleSelectMenuInteraction
						| ChannelSelectMenuInteraction
						| MentionableSelectMenuInteraction,
				);
			}
			if (interaction.isModalSubmit()) {
				this.modalsHandler.onModalSubmit(interaction as ModalSubmitInteraction);
			}
		});
	}

	public getDjsConfig(): Config<Plugins> {
		return this.djsConfig;
	}

	public async waitForPlugins(): Promise<void> {
		await this.pluginInitPromise;
	}

	private async initPlugins() {
		const pluginsInput = this.djsConfig.plugins;
		if (!pluginsInput) return;

		for (const input of pluginsInput) {
			try {
				let plugin: DjsPlugin | undefined;

				if (
					input instanceof Promise ||
					(input && typeof input === "object" && "then" in input)
				) {
					const module = await input;
					plugin = Object.values(module).find(
						// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin loading
						(v: any) =>
							v && typeof v === "object" && "name" in v && "setup" in v,
					) as DjsPlugin;
				} else {
					plugin = input as DjsPlugin;
				}

				if (!plugin) continue;

				const config =
					// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin config
					(this.djsConfig.pluginsConfig as any)?.[plugin.name] ?? {};
				// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin injection
				const extension = await plugin.setup(this as any, config);
				// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin injection
				(this as any)[plugin.name] = extension;

				if (plugin.onReady) {
					this.once(Events.ClientReady, async () => {
						try {
							// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin injection
							await plugin.onReady?.(this as any, config, extension);
						} catch (error) {
							console.error(`[Plugin:${plugin.name}] Error in onReady:`, error);
						}
					});
				}
			} catch (error) {
				console.error("[Plugin] Error in setup:", error);
			}
		}
	}
}

export type DjsClientInstance<
	UserConfig = unknown,
	// biome-ignore lint/suspicious/noExplicitAny: generic plugin array
	Plugins extends readonly any[] = any[],
> = DjsClient<UserConfig, Plugins> &
	PluginsExtensionsMap<Plugins> &
	PluginsExtensions;
