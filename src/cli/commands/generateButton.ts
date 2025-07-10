import { Command as Cli } from "commander";
import inquirer from "inquirer";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { buttonTpl } from "../templates/button";
import { openFile } from "../utils/openFile";

export default function registerGenerateButton(program: Cli) {
  program
    .command("generate:button")
    .description("Generate a button interaction handler")
    .option("-i, --id <customId>", "Button customId (exact match)")
    .action(async (opts: { id?: string }) => {
      let { id } = opts;

      if (!id) {
        const a = await inquirer.prompt<{ id: string }>({
          type: "input",
          name: "id",
          message: "Button customId :",
          validate: (input) => !!input || "The customId is required",
        });
        id = a.id;
      }

      const targetDir = resolve(process.cwd(), "src/buttons");
      const targetFile = resolve(targetDir, `${id}.ts`);

      if (existsSync(targetFile)) {
        console.error(`❌ The file '${targetFile}' already exists.`);
        process.exit(1);
      }

      mkdirSync(dirname(targetFile), { recursive: true });

      const template = buttonTpl(id!);
      writeFileSync(targetFile, template, { encoding: "utf8" });

      console.log(`✅ Button handler created : ${targetFile}`);
      openFile(targetFile);
    });
} 