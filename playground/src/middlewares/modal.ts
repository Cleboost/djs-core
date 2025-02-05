import { ModalMiddleware } from "djs-core";

export default new ModalMiddleware().run(async (interaction) => {
  console.log(interaction.id);
  return true;
});
