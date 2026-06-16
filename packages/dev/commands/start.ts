import type { CAC } from "cac";
import pc from "picocolors";
import { banner, runBot } from "../utils/common";

export function registerStartCommand(cli: CAC) {
	cli
		.command("start", "Start the bot")
		.option("-p, --path <path>", "Custom project path", { default: "." })
		.action(async (options) => {
			console.log(banner);
			const { client } = await runBot(options.path);

			const shutdown = async () => {
				console.log(pc.dim("\nShutting down..."));
				await client.destroy();
				process.exit(0);
			};

			process.on("SIGINT", shutdown);
			process.on("SIGTERM", shutdown);
		});
}
