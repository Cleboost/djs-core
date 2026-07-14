import { Command } from "@djs-core/runtime";
import { PermissionFlagsBits } from "discord.js";
export default new Command()
  .setDescription("Kick a user")
	.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
	.run(async (interaction) => {
		await interaction.reply("Pong!");
	});
