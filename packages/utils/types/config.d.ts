export interface Config {
	token: string;
	servers: string[];
	experimental?: {
		cron?: boolean;
	};
}
