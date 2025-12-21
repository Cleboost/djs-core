import { EventLister } from "@djs-core/runtime";
import { ActivityType, Events } from "discord.js";

export default new EventLister().event(Events.ClientReady).run((client) => {
	client.user.setActivity({ name: "🥖 bread", type: ActivityType.Custom });
});
