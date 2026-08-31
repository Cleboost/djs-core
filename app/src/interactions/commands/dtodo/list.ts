import { Command } from "@djs-core/runtime";
import { desc, schema } from "#db";

export default new Command()
	.setDescription("List all your tasks")
	.run(async (interaction) => {
		const items = await interaction.client.db
			.select()
			.from(schema.todos)
			.orderBy(desc(schema.todos.createdAt));

		if (items.length === 0) {
			return interaction.reply("📭 Your todo list is empty!");
		}

		const list = items
			.map(
				(t) => `\`#${t.id}\` - **${t.task}** (${t.createdAt.toLocaleString()})`,
			)
			.join("\n");
		return interaction.reply(`📝 **Your Todo List:**\n${list}`);
	});
