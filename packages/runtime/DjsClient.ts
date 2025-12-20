import { ChatInputCommandInteraction, Client, Events, IntentsBitField, type Interaction, type ButtonInteraction } from "discord.js";
import CommandHandler from "./handler/CommandHandler";
import ButtonHandler from "./handler/ButtonHandler";

export default class DjsClient extends Client {
    public eventsHandler = null
    public commandsHandler: CommandHandler = new CommandHandler(this);
    public buttonsHandler: ButtonHandler = new ButtonHandler(this);

    constructor({servers}: {servers: string[]}) {
        super({ intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.GuildMessageReactions, IntentsBitField.Flags.GuildVoiceStates] });

        this.commandsHandler.setGuilds(servers);

        // this.once(Events.ClientReady, () => {
        //     console.log(`Client is ready as ${this.user?.username}`);
        // });

        this.on(Events.InteractionCreate, (interaction: Interaction) => {
            if (interaction.isCommand()) {
                this.commandsHandler.onCommandInteraction(interaction as ChatInputCommandInteraction)
            }
            if (interaction.isButton()) {
                this.buttonsHandler.onButtonInteraction(interaction as ButtonInteraction)
            }
        });
    }
}