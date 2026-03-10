import demo from "@components/modals/demo";
import { Command } from "@djs-core/runtime";

export default new Command()
	.setDescription("Demo modal command")
	.run(async (interaction) => {
		return interaction.showModal(demo);
	});
