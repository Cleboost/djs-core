import { Command as Cli } from "commander";
import inquirer from "inquirer";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { commandTpl } from "../templates/command";
import { openFile } from "../utils/openFile";

export default function registerGenerateCommand(program: Cli) {
  program
    .command("generate:command")
    .description("Generate a new slash command")
    .option("-n, --name <name>", "Command name")
    .option("-d, --description <description>", "Command description")
    .action(async (opts: { name?: string; description?: string }) => {
      let { name, description } = opts;

      if (!name) {
        const a = await inquirer.prompt<{ name: string }>({
          type: "input",
          name: "name",
          message: "Command name :",
          validate: (input) => !!input || "The name is required",
        });
        name = a.name;
      }

      if (!description) {
        const a = await inquirer.prompt<{ description: string }>({
          type: "input",
          name: "description",
          message: "Command description :",
          validate: (input) => !!input || "The description is required",
        });
        description = a.description;
      }

      const targetDir = resolve(process.cwd(), "src/commands");
      const targetFile = resolve(targetDir, `${name}.ts`);

      if (existsSync(targetFile)) {
        console.error(`❌ The file '${targetFile}' already exists.`);
        process.exit(1);
      }

      mkdirSync(dirname(targetFile), { recursive: true });

      const template = commandTpl(name!, description!);
      writeFileSync(targetFile, template, { encoding: "utf8" });

      console.log(`✅ Command created : ${targetFile}`);
      openFile(targetFile);
    });
} 