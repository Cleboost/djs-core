import { Command as Cli } from "commander";
import inquirer from "inquirer";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { spawn } from "child_process";

function openFile(filePath: string) {
  const editor = process.env.VISUAL || process.env.EDITOR;
  const safeFilePath = resolve(filePath);
  if (editor) {
    spawn(editor, [safeFilePath], { stdio: "inherit", detached: true });
    return;
  }
  const platform = process.platform;
  if (platform === "win32") {
    import { execFile } from "child_process";
    const safeFilePath = resolve(filePath);
    execFile("cmd", ["/c", "start", "", `"${safeFilePath}"`], (err) => {
      if (err) {
        console.error(`Failed to open file: ${err.message}`);
      }
    });
    return;
  } else if (platform === "darwin") {
    const safeFilePath = resolve(filePath);
    execFile("open", [safeFilePath], (err) => {
      if (err) {
        console.error(`Failed to open file: ${err.message}`);
      }
    });
  } else {
    const safeFilePath = resolve(filePath);
    execFile("xdg-open", [safeFilePath], (err) => {
      if (err) {
        console.error(`Failed to open file: ${err.message}`);
      }
    });
  }
}

const program = new Cli();
program.name("djs-core").description("CLI pour le framework djs-core").version("2.0.0");

/**
 * generate:command – crée un squelette de slash-command
 */
program
  .command("generate:command")
  .description("Génère une nouvelle commande slash")
  .option("-n, --name <name>", "Nom de la commande")
  .option("-d, --description <description>", "Description de la commande")
  .action(async (opts: { name?: string; description?: string }) => {
    let { name, description } = opts;

    if (!name) {
      const a = await inquirer.prompt<{ name: string }>({
        type: "input",
        name: "name",
        message: "Nom de la commande :",
        validate: (input) => !!input || "Le nom est requis",
      });
      name = a.name;
    }

    if (!description) {
      const a = await inquirer.prompt<{ description: string }>({
        type: "input",
        name: "description",
        message: "Description de la commande :",
        validate: (input) => !!input || "La description est requise",
      });
      description = a.description;
    }

    const targetDir = resolve(process.cwd(), "src/commands");
    const targetFile = resolve(targetDir, `${name}.ts`);

    if (existsSync(targetFile)) {
      console.error(`❌ Le fichier '${targetFile}' existe déjà.`);
      process.exit(1);
    }

    mkdirSync(dirname(targetFile), { recursive: true });

    const template = `import { Command } from "djs-core";

export default new Command()
  .setName("${name}")
  .setDescription("${description}")
  .run((_client, interaction) => {
    // TODO: implement the command logic
    interaction.reply("${description}");
  });
`;

    writeFileSync(targetFile, template, { encoding: "utf8" });
    console.log(`✅ Command created : ${targetFile}`);
    openFile(targetFile);
  });

/**
 * generate:event – create a skeleton of event listener
 */
program
  .command("generate:event")
  .description("Generate a new Discord event")
  .option("-n, --name <name>", "Discord event name ex. ready, messageCreate…")
  .option("-o, --once", "Execute once (client.once)")
  .action(async (opts: { name?: string; once?: boolean }) => {
    let { name, once } = opts;

    if (!name) {
      const a = await inquirer.prompt<{ name: string }>({
        type: "input",
        name: "name",
        message: "Event name :",
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

    const template = `import { BaseEvent } from "djs-core";

export default class ${name.charAt(0).toUpperCase() + name.slice(1)}Event extends BaseEvent {
  eventName = "${name}" as const;
  ${once ? "once = true;" : ""}

  async execute(client, ...args: any[]) {
    // TODO: implement the event logic
    console.log("${name} event triggered", args);
  }
}
`;

    writeFileSync(targetFile, template, { encoding: "utf8" });
    console.log(`✅ Event created : ${targetFile}`);
    openFile(targetFile);
  });

/**
 * dev – stub for hot-reload (future implementation)
 */
program
  .command("dev [path]")
  .description("Start the bot in development mode with hot-reload")
  .action(async (p: string | undefined) => {
    const { runDev } = await import("../devtools/dev.ts");
    await runDev(p ?? ".");
  });

/**
  * build – stub for bundling
 */
program
  .command("build [path]")
  .description("Build the production bundle")
  .option("-d, --docker", "Generate a Dockerfile ready to use in dist/")
  .action((p: string | undefined, opts: { docker?: boolean }) => {
    import("../devtools/build.ts").then(async ({ runBuild }) => {
      await runBuild(p ?? ".", { docker: !!opts.docker });
    });
  });

program.parse(process.argv);