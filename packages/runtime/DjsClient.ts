import {
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
import ApplicationCommandHandler from "./handler/ApplicationCommandHandler";
import ButtonHandler from "./handler/ButtonHandler";
import CommandHandler from "./handler/CommandHandler";
import ContextMenuHandler from "./handler/ContextMenuHandler";
import EventHandler from "./handler/EventHandler";
import ModalHandler from "./handler/ModalHandler";
import SelectMenuHandler from "./handler/SelectMenuHandler";
import { cleanupExpiredTokens } from "./store/DataStore";

export default class DjsClient extends Client {
	public eventsHandler: EventHandler = new EventHandler(this);
	public commandsHandler: CommandHandler = new CommandHandler(this);
	public buttonsHandler: ButtonHandler = new ButtonHandler(this);
	public contextMenusHandler: ContextMenuHandler = new ContextMenuHandler(this);
	public selectMenusHandler: SelectMenuHandler = new SelectMenuHandler(this);
	public modalsHandler: ModalHandler = new ModalHandler(this);
	public applicationCommandHandler: ApplicationCommandHandler =
		new ApplicationCommandHandler(this);

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
		this.applicationCommandHandler.setGuilds(servers);

		this.once(Events.ClientReady, () => {
			const deleted = cleanupExpiredTokens();
			if (deleted > 0) {
				console.log(`🧹 Cleaned up ${deleted} expired token(s) on startup`);
			}
		});

		setInterval(() => {
			const deleted = cleanupExpiredTokens();
			if (deleted > 0) {
				console.log(`🧹 Cleaned up ${deleted} expired token(s)`);
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
			if (interaction.isModalSubmit()) {
				this.modalsHandler.onModalSubmit(
					interaction as ModalSubmitInteraction,
				);
			}
		});
	}
}
