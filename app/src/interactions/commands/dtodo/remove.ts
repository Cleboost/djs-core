import { Command } from "@djs-core/runtime";
import { eq } from "drizzle-orm";
import { todos } from "../../../db/schema";

export default new Command()
	.setDescription("Remove a task from your todo list")
	.addIntegerOption((opt) =>
		opt.setName("id").setDescription("The ID of the task").setRequired(true),
	)
	.run(async (interaction) => {
		const id = interaction.options.getInteger("id", true);

		const [deleted] = await interaction.client.drizzle
			.delete(todos)
			.where(eq(todos.id, id))
			.returning();

		if (!deleted) {
			return interaction.reply(`❌ Task with ID \`#${id}\` not found.`);
		}
		return interaction.reply(`🗑️ Removed task \`#${id}\`: **${deleted.task}**`);
	});
