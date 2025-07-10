import { Command as Cli } from "commander";

export default function registerDev(program: Cli) {
  program
    .command("dev [path]")
    .description("Start the bot in development mode with hot-reload")
    .action(async (p: string | undefined) => {
      const { runDev } = await import("../../devtools/dev.ts");
      await runDev(p ?? ".");
    });
} 