import { Command } from "@djs-core/runtime";
import { todos } from "../../../db/schema";

export default new Command()
	.setDescription("Add a new task")
	.addStringOption((opt) =>
		opt.setName("task").setDescription("The task to add").setRequired(true),
	)
	.run(async (interaction) => {
		const task = interaction.options.getString("task", true);

		const [result] = await interaction.client.drizzle
			.insert(todos)
			.values({ task })
			.returning();

		return interaction.reply(
			`✅ Added task: **${result?.task}** (ID: \`#${result?.id}\`)`,
		);
	});
