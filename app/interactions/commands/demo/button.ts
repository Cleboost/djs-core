import { Command } from "@djs-core/runtime";
import { ActionRowBuilder, ButtonBuilder, MessageFlags } from "discord.js";
import subdemo from "../../buttons/demo/subdemo";

export default new Command()
    .setDescription("Demo button command")
    .run(async (_client, interaction) => {
        return interaction.reply({
            content: "Demo button", flags: [MessageFlags.Ephemeral], components: [
                new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(subdemo)
            ]
        });
    });
