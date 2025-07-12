import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
import { SubCommand } from "djs-core";

export default new SubCommand()
    .setName("button")
    .setParent("handler")
    .setDescription("Create button")
    .run((_client, interaction) => {
        interaction.reply({
            components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(new ButtonBuilder()
                        .setCustomId("test")
                        .setLabel("Test")
                        .setStyle(ButtonStyle.Primary)
                    )
            ]
        });
    });