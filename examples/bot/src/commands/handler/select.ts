import {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} from "discord.js";
import { SubCommand } from "djs-core";

export default new SubCommand()
    .setName("select")
    .setParent("handler")
    .setDescription("Create select menu")
    .run((_client, interaction) => {
        interaction.reply({
            components: [
                new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("test")
                        .setPlaceholder("Test")
                        .setMinValues(1)
                        .setMaxValues(1)
                        .addOptions(new StringSelectMenuOptionBuilder()
                            .setLabel("Test")
                            .setValue("test")
                            .setDescription("Test"))
                )
            ]
        });
    });