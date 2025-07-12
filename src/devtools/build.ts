import { promises as fs } from "fs";
import { resolve, extname, relative, join } from "path";
import { build as tsupBuild } from "tsup";
import { pathToFileURL } from "url";
import { PluginManager } from "../plugins/manager.ts";
import type { DjsCorePlugin } from "../plugins/types.ts";

const CONFIG = {
  DIRECTORIES: {
    commands: "src/commands",
    events: "src/events",
    buttons: "src/buttons",
    selects: "src/selects",
    modals: "src/modals",
    contextMenus: "src/contexts",
  } as const,
  VALID_EXT: [".ts", ".js", ".mjs", ".cjs"],
  GENERATED_DIR: ".djs-core/generated",
} as const;

interface CommandGroup {
  name: string;
  groupFile: string;
  subcommands: Array<{ name: string; file: string; varName: string }>;
}

async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(dir: string, matcher: (file: string) => boolean): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, matcher)));
    } else if (entry.isFile() && matcher(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function collectAndImportFiles(
  root: string,
  dir: string,
  prefix: string,
  files: string[],
  importLines: string[],
  vars: string[],
  instantiate = false,
): Promise<void> {
  if (!(await exists(dir))) return;

  const collected = await collectFiles(dir, (f) => CONFIG.VALID_EXT.includes(extname(f) as typeof CONFIG.VALID_EXT[number]));
  files.push(...collected);

  collected.forEach((file, idx) => {
    const rel = "../../" + relative(root, file).replace(/\\/g, "/");
    const varName = `${prefix}${idx}`;
    importLines.push(`import ${varName} from "${rel}";`);
    vars.push(instantiate ? `new ${varName}()` : varName);
  });
}

async function processSingleCommand(
  root: string,
  dir: string,
  item: string,
  commandVars: string[],
  commandFiles: string[],
  importLines: string[],
): Promise<void> {
  const commandName = item.replace(".ts", "");
  const commandPath = join(dir, item);
  const commandRel = "../../" + relative(root, commandPath).replace(/\\/g, "/");
  const commandVarName = `Cmd${commandName.charAt(0).toUpperCase() + commandName.slice(1)}`;

  importLines.push(`import ${commandVarName} from "${commandRel}";`);
  commandVars.push(commandVarName);
  commandFiles.push(commandPath);
}

async function collectCommandGroups(
  root: string,
  commandsDir: string,
  importLines: string[],
  commandGroups: CommandGroup[],
  commandVars: string[],
  commandFiles: string[],
  setupLines: string[],
): Promise<void> {
  if (!(await exists(commandsDir))) return;

  const items = await fs.readdir(commandsDir);

  for (const item of items) {
    const itemPath = join(commandsDir, item);
    const stats = await fs.stat(itemPath);

    if (stats.isDirectory()) {
      const groupName = item;
      const groupPath = itemPath;
      const indexPath = join(groupPath, "index.ts");

      if (await exists(indexPath)) {
        const groupRel = "../../" + relative(root, indexPath).replace(/\\/g, "/");
        const groupVarName = `Group${groupName.charAt(0).toUpperCase() + groupName.slice(1)}`;
        importLines.push(`import ${groupVarName} from "${groupRel}";`);

        const subcommands: CommandGroup["subcommands"] = [];
        const subItems = await fs.readdir(groupPath);

        for (const subItem of subItems) {
          if (subItem.endsWith(".ts") && subItem !== "index.ts") {
            const subcommandName = subItem.replace(".ts", "");
            const subcommandPath = join(groupPath, subItem);
            const subcommandRel = "../../" + relative(root, subcommandPath).replace(/\\/g, "/");
            const subcommandVarName = `Sub${groupName.charAt(0).toUpperCase() + groupName.slice(1)}${subcommandName.charAt(0).toUpperCase() + subcommandName.slice(1)}`;

            importLines.push(`import ${subcommandVarName} from "${subcommandRel}";`);
            subcommands.push({ name: subcommandName, file: subcommandPath, varName: subcommandVarName });
          }
        }

        const commandVarName = `Cmd${groupName.charAt(0).toUpperCase() + groupName.slice(1)}`;
        commandVars.push(commandVarName);

        setupLines.push(`
const ${commandVarName} = new Command()
  .setName("${groupName}")
  .setDescription(${groupVarName}.description || "Commandes ${groupName}");
${subcommands.map((sub) => `${commandVarName}.addSubcommand(${sub.varName});`).join("\n")}`);

        commandGroups.push({ name: groupName, groupFile: indexPath, subcommands });
        commandFiles.push(indexPath, ...subcommands.map((s) => s.file));
      } else {
        const subItems = await fs.readdir(groupPath);
        for (const subItem of subItems) {
          if (subItem.endsWith(".ts")) {
            await processSingleCommand(root, groupPath, subItem, commandVars, commandFiles, importLines);
          }
        }
      }
    }
    else if (item.endsWith(".ts") && item !== "index.ts") {
      await processSingleCommand(root, commandsDir, item, commandVars, commandFiles, importLines);
    }
  }
}

function buildHandlerContent(
  root: string,
  cfgFile: string,
  importLines: string[],
  commandVars: string[],
  eventVars: string[],
  buttonVars: string[],
  selectVars: string[],
  modalVars: string[],
  contextMenuVars: string[],
  setupLines: string[],
): string {
  const cfgRel = "./" + relative(resolve(root, CONFIG.GENERATED_DIR), resolve(root, cfgFile)).replace(/\\/g, "/");

  return `import { Client } from "discord.js";
import { Command } from "djs-core";
import config from "${cfgRel}";
${importLines.join("\n")} 
import { registerHandlers } from "djs-core";

const client = new Client({ intents: config.intents ?? [] });

if (Array.isArray(config.plugins)) {
  for (const plugin of config.plugins) {
    await plugin.setupClient?.(client);
  }
}

${setupLines.join("\n")}

registerHandlers({
  client,
  commands: [${commandVars.join(", ")}],
  events: [${eventVars.join(", ")}],
  buttons: [${buttonVars.join(", ")}],
  selectMenus: [${selectVars.join(", ")}],
  modals: [${modalVars.join(", ")}],
  contextMenus: [${contextMenuVars.join(", ")}],
});

client.login(config.token);
`;
}

async function generateProdPackageJson(root: string, distDir: string, opts: { js?: boolean }): Promise<void> {
  try {
    const userPkgPath = resolve(root, "package.json");
    const userPkg = JSON.parse(await fs.readFile(userPkgPath, "utf8"));
    const runtimeCmd = opts.js ? "node" : "bun";

    const prodPkg = {
      name: userPkg.name ?? "my-bot",
      version: userPkg.version ?? "1.0.0",
      type: "module",
      main: "index.js",
      dependencies: userPkg.dependencies ?? {},
      scripts: {
        ...Object.fromEntries(Object.entries(userPkg.scripts ?? {}).filter(([k]) => k !== "build")),
        start: `${runtimeCmd} index.js`,
      },
    } as const;

    await fs.writeFile(resolve(distDir, "package.json"), JSON.stringify(prodPkg, null, 2));
  } catch (error) {
    console.warn("⚠️  Failed to generate dist/package.json", error);
  }
}

async function generateDockerfile(distDir: string): Promise<void> {
  const content = `# ---- DO NOT EDIT THIS FILE UNLESS YOU KNOW WHAT YOU ARE DOING ----\nFROM oven/bun:alpine\nWORKDIR /app\nCOPY . .\nRUN bun i --production\nCMD [\"bun\", \"start\"]\n`;
  await fs.writeFile(resolve(distDir, "Dockerfile"), content);
}

export async function runBuild(projectRoot: string, opts: { docker?: boolean; js?: boolean } = {}): Promise<void> {
  const root = resolve(process.cwd(), projectRoot ?? ".");

  const cfgCandidates = ["djsconfig.ts", "djsconfig.js"] as const;
  let cfgFile: string | undefined;
  for (const candidate of cfgCandidates) {
    if (await exists(resolve(root, candidate))) {
      cfgFile = candidate;
      break;
    }
  }
  if (!cfgFile) throw new Error("djsconfig.ts/js not found in project root");

  const cfgModule = await import(pathToFileURL(resolve(root, cfgFile)).href);
  const config = cfgModule.default ?? cfgModule;

  const pluginManager = new PluginManager((config.plugins ?? []) as DjsCorePlugin[]);
  const distDir = resolve(root, "dist");
  await pluginManager.runBuildHook({ root, outDir: distDir });
  await pluginManager.generateTypeDeclarations(root);

  const commandFiles: string[] = [];
  const eventFiles: string[] = [];
  const buttonFiles: string[] = [];
  const selectFiles: string[] = [];
  const modalFiles: string[] = [];
  const contextMenuFiles: string[] = [];

  const importLines: string[] = [];
  const commandVars: string[] = [];
  const eventVars: string[] = [];
  const buttonVars: string[] = [];
  const selectVars: string[] = [];
  const modalVars: string[] = [];
  const contextMenuVars: string[] = [];
  const commandGroups: CommandGroup[] = [];
  const setupLines: string[] = [];

  await collectCommandGroups(root, resolve(root, CONFIG.DIRECTORIES.commands), importLines, commandGroups, commandVars, commandFiles, setupLines);
  await collectAndImportFiles(root, resolve(root, CONFIG.DIRECTORIES.events), "Evt", eventFiles, importLines, eventVars, true);
  await collectAndImportFiles(root, resolve(root, CONFIG.DIRECTORIES.buttons), "Btn", buttonFiles, importLines, buttonVars);
  await collectAndImportFiles(root, resolve(root, CONFIG.DIRECTORIES.selects), "Sel", selectFiles, importLines, selectVars);
  await collectAndImportFiles(root, resolve(root, CONFIG.DIRECTORIES.modals), "Mod", modalFiles, importLines, modalVars);
  await collectAndImportFiles(root, resolve(root, CONFIG.DIRECTORIES.contextMenus), "Ctx", contextMenuFiles, importLines, contextMenuVars);

  const genDir = resolve(root, CONFIG.GENERATED_DIR);
  await fs.mkdir(genDir, { recursive: true });
  const entryPath = resolve(genDir, "index.ts");

  const handlerContent = buildHandlerContent(root, cfgFile, importLines, commandVars, eventVars, buttonVars, selectVars, modalVars, contextMenuVars, setupLines);
  await fs.writeFile(entryPath, handlerContent, { encoding: "utf8" });

  const userPkg = JSON.parse(await fs.readFile(resolve(root, "package.json"), "utf8"));
  const externalDeps = [
    "discord.js",
    "bun:sqlite",
    ...Object.keys(userPkg.dependencies ?? {}),
  ];

  await tsupBuild({
    entry: [entryPath.replace(/\\/g, "/")],
    format: "esm",
    clean: true,
    minify: true,
    outDir: distDir,
    target: "es2022",
    treeshake: true,
    dts: false,
    silent: true,
    external: Array.from(new Set(externalDeps)),
  });

  await pluginManager.copyArtifacts(root, distDir);
  await generateProdPackageJson(root, distDir, opts);
  if (opts.docker) await generateDockerfile(distDir);
  await fs.rm(genDir, { recursive: true, force: true });
  await pluginManager.runPostBuildHook({ root, outDir: distDir });

  const finalFile = resolve(distDir, "index.js");
  const sizeKB = ((await fs.stat(finalFile)).size / 1024).toFixed(2);

  const totalInputs = commandFiles.length + eventFiles.length + buttonFiles.length + selectFiles.length + modalFiles.length;
  const totalInputsWithCtx = totalInputs + contextMenuFiles.length;
  const subcommandGroupCount = commandGroups.length;
  const subcommandCount = commandGroups.reduce((acc, g) => acc + g.subcommands.length, 0);
  const runtimeLabel = opts.js ? "Node.js" : "Bun";

  console.log(`✅ Build completed:
  - Commandes : ${commandFiles.length}
  - Groupes de sous-commandes : ${subcommandGroupCount}
  - Sous-commandes : ${subcommandCount}
  - Événements : ${eventFiles.length}
  - Boutons : ${buttonFiles.length}
  - Selects Menus : ${selectFiles.length}
  - Modals : ${modalFiles.length}
  - Context Menus : ${contextMenuFiles.length}
  - Total : ${totalInputsWithCtx} fichier(s)
  - Sortie : dist/index.js (${sizeKB} KB)
  - Runtime : ${runtimeLabel}
  ${opts.docker ? "- Dockerfile generated" : ""}`);
}