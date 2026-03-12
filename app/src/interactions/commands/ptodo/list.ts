import { Command } from "@djs-core/runtime";

export default new Command()
	.setDescription("List all your tasks using Prisma")
	.run(async (interaction) => {
		const todos = await interaction.client.prisma.prismaTodo.findMany({
			orderBy: {
				createdAt: "desc",
			},
		});

		if (todos.length === 0) {
			return interaction.reply("📭 Your Prisma todo list is empty!");
		}

		const list = todos
			.map(
				(t) => `\`#${t.id}\` - **${t.task}** (${t.createdAt.toLocaleString()})`,
			)
			.join("\n");
		return interaction.reply(`📝 **Your Prisma Todo List:**\n${list}`);
	});
