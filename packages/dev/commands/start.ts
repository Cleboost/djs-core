import type { CAC } from "cac";
import pc from "picocolors";
import { banner, runBot } from "../utils/common";

export function registerStartCommand(cli: CAC) {
	cli
		.command("start", "Start the bot")
		.option("-p, --path", "Custom project path", { default: "." })
		.action(async (options) => {
			console.log(banner);
			const { client } = await runBot(options.path);

			process.on("SIGINT", async () => {
				console.log(pc.dim("\nShutting down..."));
				await client.destroy();
				process.exit(0);
			});
		});
}
