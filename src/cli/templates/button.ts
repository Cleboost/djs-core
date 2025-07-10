export const buttonTpl = (customId: string) => `
import { Button } from "djs-core";

export default new Button()
  .setCustomID("${customId}")
  .run((_client, interaction) => {
    // TODO: implement the button logic
    interaction.reply({ content: "Button '${customId}' clicked!", ephemeral: true });
  });
`; 