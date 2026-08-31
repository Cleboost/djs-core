import { Command } from "@djs-core/runtime";
import { schema } from "#db";

export default new Command()
	.setDescription("Add a new task to your todo list")
	.addStringOption((opt) =>
		opt.setName("task").setDescription("The task to add").setRequired(true),
	)
	.run(async (interaction) => {
		const task = interaction.options.getString("task", true);

		await interaction.client.db.insert(schema.todos).values({ task });

		return interaction.reply(`✅ Added task: **${task}**`);
	});
