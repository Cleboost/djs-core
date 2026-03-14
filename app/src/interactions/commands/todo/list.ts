import { Command } from "@djs-core/runtime";

export default new Command()
	.setDescription("List all your tasks")
	.run(async (interaction) => {
		const todos = interaction.client.sql
			.execute`SELECT * FROM todos ORDER BY created_at DESC` as {
			id: number;
			task: string;
			created_at: string;
		}[];

		if (todos.length === 0) {
			return interaction.reply("📭 Your todo list is empty!");
		}

		const list = todos
			.map((t) => `\`#${t.id}\` - **${t.task}** (${t.created_at})`)
			.join("\n");
		return interaction.reply(`📝 **Your Todo List:**\n${list}`);
	});
