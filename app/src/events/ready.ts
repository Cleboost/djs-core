import { EventListner } from "@djs-core/runtime";
import { ActivityType, Events } from "discord.js";

export default new EventListner().event(Events.ClientReady).run((client) => {
	client.user?.setActivity({ name: "🥖 bread", type: ActivityType.Custom });
});
