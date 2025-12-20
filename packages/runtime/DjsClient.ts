import {
	type ChatInputCommandInteraction,
	Client,
	Events,
	IntentsBitField,
	type Interaction,
	type ButtonInteraction,
} from "discord.js";
import CommandHandler from "./handler/CommandHandler";
import ButtonHandler from "./handler/ButtonHandler";
import EventHandler from "./handler/EventHandler";
import { cleanupExpiredTokens } from "./store/ButtonDataStore";

export default class DjsClient extends Client {
	public eventsHandler: EventHandler = new EventHandler(this);
	public commandsHandler: CommandHandler = new CommandHandler(this);
	public buttonsHandler: ButtonHandler = new ButtonHandler(this);

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
		});
	}
}
