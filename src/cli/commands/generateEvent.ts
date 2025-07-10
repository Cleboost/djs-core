import { Command as Cli } from "commander";
import inquirer from "inquirer";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { eventTpl } from "../templates/event";
import { openFile } from "../utils/openFile";

export default function registerGenerateEvent(program: Cli) {
  program
    .command("generate:event")
    .description("Generate a Discord event listener")
    .option("-n, --name <name>", "Discord event name ex. ready, messageCreate…")
    .option("-o, --once", "Execute once (client.once)")
    .action(async (opts: { name?: string; once?: boolean }) => {
      let { name, once } = opts;

      if (!name) {
        const a = await inquirer.prompt<{ name: string }>({
          type: "input",
          name: "name",
          message: "Discord event name :",
          validate: (input) => !!input || "The name is required",
        });
        name = a.name;
      }

      const targetDir = resolve(process.cwd(), "src/events");
      const targetFile = resolve(targetDir, `${name}.ts`);

      if (existsSync(targetFile)) {
        console.error(`❌ The file '${targetFile}' already exists.`);
        process.exit(1);
      }

      mkdirSync(dirname(targetFile), { recursive: true });

      const template = eventTpl(name!, !!once);
      writeFileSync(targetFile, template, { encoding: "utf8" });

      console.log(`✅ Event created : ${targetFile}`);
      openFile(targetFile);
    });
} 