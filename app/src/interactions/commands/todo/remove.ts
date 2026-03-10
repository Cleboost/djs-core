import { Command } from "@djs-core/runtime";

export default new Command()
	.setDescription("Remove a task from your todo list")
	.addIntegerOption((opt) =>
		opt.setName("id").setDescription("The ID of the task").setRequired(true),
	)
	.run(async (interaction) => {
		const id = interaction.options.getInteger("id", true);
		interaction.client.sql.run("DELETE FROM todos WHERE id = ?", [id]);
		return interaction.reply(`🗑️ Removed task with ID: \`#${id}\``);
	});
