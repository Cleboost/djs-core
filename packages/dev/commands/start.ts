import { devLog } from "@djs-core/runtime";
import type { CAC } from "cac";
import { banner, runBot } from "../utils/common";

export function registerStartCommand(cli: CAC) {
	cli
		.command("start", "Start the bot")
		.option("-p, --path <path>", "Custom project path", { default: "." })
		.action(async (options) => {
			devLog.raw(banner);
			const { client } = await runBot(options.path);

			const shutdown = async () => {
				devLog.info("Shutting down...");
				await client.destroy();
				process.exit(0);
			};

			process.on("SIGINT", shutdown);
			process.on("SIGTERM", shutdown);
		});
}
