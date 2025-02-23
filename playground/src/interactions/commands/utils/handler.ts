import { SubCommandGroup } from "djs-core";

export default new SubCommandGroup()
  .setName("handler")
  .setDescription("Test handler composent")
  .addSubcommand((sub) => sub.setName("button").setDescription("Create button"))
  .addSubcommand((sub) =>
    sub.setName("select").setDescription("Create select menu"),
  )
  .addSubcommand((sub) => sub.setName("modal").setDescription("Create modal"))
  .addSubcommand((sub) =>
    sub
      .setName("autocomplete")
      .setDescription("Create autocomplete")
      .addStringOption((option) =>
        option
          .setName("input")
          .setDescription("This is an input")
          .setAutocomplete(true)
          .setRequired(true),
      ),
  );
