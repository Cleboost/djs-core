import { Button } from "djs-core";

export default new Button()
.setCustomId("ping")
.run((client, interaction) => {
    interaction.reply("I am a fucking subfolder ping button");
})
