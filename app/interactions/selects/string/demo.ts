import { StringSelectMenu } from "@djs-core/runtime";

export default new StringSelectMenu().run(async (interaction) => {
	await interaction.reply({ content: "Hello, world!" });
});
