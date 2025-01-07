import { SelectMenu } from "djs-core";

export default new SelectMenu()
.setCustomId("test")
.run((client, interaction) => {
    const choice = interaction.values[0]
    return interaction.reply("You selected: " + choice)
})