import {
	type ChatInputCommandInteraction,
	Client,
	Events,
	IntentsBitField,
	type Interaction,
	type ButtonInteraction,
	type ContextMenuCommandInteraction,
	type StringSelectMenuInteraction,
	type UserSelectMenuInteraction,
	type RoleSelectMenuInteraction,
	type ChannelSelectMenuInteraction,
	type MentionableSelectMenuInteraction,
} from "discord.js";
import CommandHandler from "./handler/CommandHandler";
import ButtonHandler from "./handler/ButtonHandler";
import ContextMenuHandler from "./handler/ContextMenuHandler";
import SelectMenuHandler from "./handler/SelectMenuHandler";
import EventHandler from "./handler/EventHandler";
import { cleanupExpiredTokens } from "./store/ButtonDataStore";

export default class DjsClient extends Client {
	public eventsHandler: EventHandler = new EventHandler(this);
	public commandsHandler: CommandHandler = new CommandHandler(this);
	public buttonsHandler: ButtonHandler = new ButtonHandler(this);
	public contextMenusHandler: ContextMenuHandler = new ContextMenuHandler(this);
	public selectMenusHandler: SelectMenuHandler = new SelectMenuHandler(this);

	constructor({ servers }: { servers: string[] }) {
		super({
			intents: [
				IntentsBitField.Flags.Guilds,
				IntentsBitField.Flags.GuildMessages,
				IntentsBitField.Flags.GuildMessageReactions,
				IntentsBitField.Flags.GuildVoiceStates,
			],
		});

		this.commandsHandler.setGuilds(servers);
		this.contextMenusHandler.setGuilds(servers);

		this.once(Events.ClientReady, () => {
			const deleted = cleanupExpiredTokens();
			if (deleted > 0) {
				console.log(
					`🧹 Cleaned up ${deleted} expired button token(s) on startup`,
				);
			}
		});

		setInterval(() => {
			const deleted = cleanupExpiredTokens();
			if (deleted > 0) {
				console.log(`🧹 Cleaned up ${deleted} expired button token(s)`);
			}
		}, 60 * 1000);

		this.on(Events.InteractionCreate, (interaction: Interaction) => {
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
		});
	}
}
