import { SelectMiddleware } from "djs-core";

export default new SelectMiddleware().run(async (interaction) => {
  if (!interaction) return false;
  return true;
});
