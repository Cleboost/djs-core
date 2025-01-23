import { SubCommandGroup } from "djs-core";

export default new SubCommandGroup()
  .setName("handler")
  .setDescription("Test handler composent")
  .addSubcommand((sub) => sub.setName("button").setDescription("Create button"))
  .addSubcommand((sub) =>
    sub.setName("select").setDescription("Create select menu"),
  )
  .addSubcommand((sub) => sub.setName("modal").setDescription("Create modal"));
