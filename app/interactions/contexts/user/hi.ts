import { ContextMenu } from "@djs-core/runtime";
import { ApplicationCommandType } from "discord.js";

export default new ContextMenu()
	.withType(ApplicationCommandType.User)
	.run((interaction) => {
		return interaction.reply({
			content: `Hi, ${interaction.targetUser.username}!`,
		});
	});
