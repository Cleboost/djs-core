import { SelectMiddleware } from "djs-core";

export default new SelectMiddleware().run(async (interaction) => {
  console.log("Select Middleware");
  return true;
});
