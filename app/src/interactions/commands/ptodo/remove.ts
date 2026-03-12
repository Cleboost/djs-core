import { Command } from "@djs-core/runtime";

export default new Command()
	.setDescription("Remove a task from your Prisma todo list")
	.addIntegerOption((opt) =>
		opt.setName("id").setDescription("The ID of the task").setRequired(true),
	)
	.run(async (interaction) => {
		const id = interaction.options.getInteger("id", true);

		try {
			await interaction.client.prisma.prismaTodo.delete({
				where: { id: id },
			});
			return interaction.reply(
				`🗑️ Removed task with ID: \`#${id}\` (using Prisma)`,
			);
		} catch (_error) {
			return interaction.reply(`❌ Task with ID \`#${id}\` not found.`);
		}
	});
