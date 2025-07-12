import { Command as Cli } from "commander";
import inquirer from "inquirer";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { contextMenuTpl } from "../templates/contextMenu";
import { openFile } from "../utils/openFile";

export default function registerGenerateContextMenu(program: Cli) {
  program
    .command("generate:contextmenu")
    .description("Génère un handler pour un context menu (user ou message)")
    .option("-n, --name <name>", "Nom du context menu")
    .option("-t, --type <type>", "Type de context menu (user | message)")
    .action(async (opts: { name?: string; type?: string }) => {
      let { name, type } = opts;

      if (!name) {
        const a = await inquirer.prompt<{ name: string }>({
          type: "input",
          name: "name",
          message: "Nom du context menu :",
          validate: (input) => !!input || "Le nom est requis",
        });
        name = a.name;
      }

      if (!type || !["user", "message"].includes(type.toLowerCase())) {
        const a = await inquirer.prompt<{ type: "user" | "message" }>({
          type: "list",
          name: "type",
          message: "Type du context menu :",
          choices: [
            { name: "User", value: "user" },
            { name: "Message", value: "message" },
          ],
        });
        type = a.type;
      }

      const typeKey = type!.toUpperCase() as "USER" | "MESSAGE";

      const safeFileName = name!.toLowerCase().replace(/\s+/g, "-");
      const targetDir = resolve(process.cwd(), type!.toLowerCase() === "user" ? "src/contextmenus/user" : "src/contextmenus/message");
      const targetFile = resolve(targetDir, `${safeFileName}.ts`);

      if (existsSync(targetFile)) {
        console.error(`❌ Le fichier '${targetFile}' existe déjà.`);
        process.exit(1);
      }

      mkdirSync(dirname(targetFile), { recursive: true });

      const template = contextMenuTpl(name!, typeKey);
      writeFileSync(targetFile, template, { encoding: "utf8" });

      console.log(`✅ Context menu créé : ${targetFile}`);
      openFile(targetFile);
    });
} 