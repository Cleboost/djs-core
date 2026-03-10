import { Command } from "@djs-core/runtime";

export default new Command()
	.setDescription("Add a new task to your todo list")
	.addStringOption((opt) =>
		opt.setName("task").setDescription("The task to add").setRequired(true),
	)
	.run(async (interaction) => {
		const task = interaction.options.getString("task", true);
		interaction.client.sql.run("INSERT INTO todos (task) VALUES (?)", [task]);
		return interaction.reply(`✅ Added task: **${task}**`);
	});
