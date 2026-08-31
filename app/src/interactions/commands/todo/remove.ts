import { Command } from "@djs-core/runtime";
import { eq, schema } from "#db";

export default new Command()
	.setDescription("Remove a task from your todo list")
	.addIntegerOption((opt) =>
		opt.setName("id").setDescription("The ID of the task").setRequired(true),
	)
	.run(async (interaction) => {
		const id = interaction.options.getInteger("id", true);

		await interaction.client.db
			.delete(schema.todos)
			.where(eq(schema.todos.id, id));

		return interaction.reply(`🗑️ Removed task with ID: \`#${id}\``);
	});
