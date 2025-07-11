import { Modal } from "djs-core";

export default new Modal()
    .setCustomId("test")
    .run((_client, interaction) => {
        const input = interaction.fields.getTextInputValue("input");
        interaction.reply({ content: `You sad ${input}` });
    });