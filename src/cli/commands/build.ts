import { Command as Cli } from "commander";
import inquirer from "inquirer";

export default function registerBuild(program: Cli) {
  program
    .command("build [path]")
    .description("Build production bundle")
    .option("-j, --js", "Generate a standalone JavaScript bundle ready for Node.js")
    .option("-d, --docker", "Add a minimal Dockerfile using Bun in dist/")
    .action(async (p: string | undefined, opts: { js?: boolean; docker?: boolean }) => {
      if (!opts.js && !opts.docker) {
        const { choice } = await inquirer.prompt<{ choice: "js" | "docker" }>([
          {
            type: "list",
            name: "choice",
            message: "What type of build do you want ?",
            choices: [
              { name: `\x1b[33mJS standalone (Node.js)\x1b[0m`, value: "js" },
              { name: `\x1b[34mDockerfile (Bun runtime)\x1b[0m`, value: "docker" },
            ],
          },
        ]);

        if (choice === "js") opts.js = true;
        else if (choice === "docker") opts.docker = true;
      }

      if (opts.js && opts.docker) {
        console.error("❌ The options --js and --docker are mutually exclusive.");
        process.exit(1);
      }

      const { runBuild } = await import("../../devtools/build.ts");
      await runBuild(p ?? ".", { js: !!opts.js, docker: !!opts.docker });
    });
} 
