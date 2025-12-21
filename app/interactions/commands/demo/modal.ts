import { Command } from "@djs-core/runtime";
import demo from "../../modals/demo";

export default new Command()
.setDescription("Demo modal command")
.run(async (client,interaction) => {
	return interaction.showModal(demo)
});