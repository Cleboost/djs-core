import { Command } from "@djs-core/runtime";
import { desc } from "drizzle-orm";
import { todos } from "../../../db/schema";

export default new Command()
	.setDescription("List all your tasks")
	.run(async (interaction) => {
		const items = await interaction.client.drizzle
			.select()
			.from(todos)
			.orderBy(desc(todos.createdAt));

		if (items.length === 0) {
			return interaction.reply("📭 Your todo list is empty!");
		}

		const list = items
			.map(
				(t) =>
					`\`#${t.id}\` - **${t.task}** (${new Date(t.createdAt * 1000).toLocaleString()})`,
			)
			.join("\n");
		return interaction.reply(`📝 **Your Todo List:**\n${list}`);
	});
