import type { InteractionContextType } from "discord.js";

export interface Config {
	token: string;
	servers: string[];
	commands?: {
		defaultContext?: InteractionContextType[];
	};
	experimental?: {
		cron?: boolean;
	};
}
