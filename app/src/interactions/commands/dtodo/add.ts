import { eq, schema } from "@djs-core/db";
import { Command } from "@djs-core/runtime";

export default new Command()
	.setDescription("Add a new task")
	.addStringOption((opt) =>
		opt.setName("task").setDescription("The task to add").setRequired(true),
	)
	.run(async (interaction) => {
		const task = interaction.options.getString("task", true);

		const [result] = await interaction.client.db
			.insert(schema.todos)
			.values({ task })
			.returning();

		return interaction.reply(
			`✅ Added task: **${result?.task}** (ID: \`#${result?.id}\`)`,
		);
	});
