import { Command } from "@djs-core/runtime";

export default new Command()
	.setDescription("Add a new task using Prisma")
	.addStringOption((opt) =>
		opt.setName("task").setDescription("The task to add").setRequired(true),
	)
	.run(async (interaction) => {
		const task = interaction.options.getString("task", true);
		
		// client.prisma is automatically typed thanks to the updated runtime
		const result = await interaction.client.prisma.prismaTodo.create({
			data: {
				task: task,
			},
		});

		return interaction.reply(`✅ Added task with Prisma: **${result.task}** (ID: \`#${result.id}\`)`);
	});
