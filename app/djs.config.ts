import type { Config } from "@djs-core/dev";

if (!process.env.TOKEN) {
	throw new Error("TOKEN environment variable is required");
}

export default {
	token: process.env.TOKEN,
	servers: ["1333211545920077896"],
	experimental: {
		cron: true,
	},
} satisfies Config;
