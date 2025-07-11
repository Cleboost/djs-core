import { readdirSync, existsSync, statSync } from "fs";
import { promises as fs } from "fs";
import { resolve, extname, relative, join } from "path";
import { build as tsupBuild } from "tsup";
import { pathToFileURL } from "url";
import { PluginManager } from "../plugins/manager.ts";
import type { DjsCorePlugin, BuildContext } from "../plugins/types.ts";

function collectFiles(dir: string, matcher: (file: string) => boolean, acc: string[]) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, matcher, acc);
    } else if (entry.isFile() && matcher(full)) {
      acc.push(full);
    }
  }
}

const DIRECTORIES = {
  commands: "src/commands",
  events: "src/events",
  buttons: "src/buttons",
} as const;

const VALID_EXT: string[] = [".ts", ".js", ".mjs", ".cjs"];
const GENERATED_DIR = ".djs-core/generated";

function collectAndImportFiles(
  root: string,
  dir: string,
  prefix: string,
  files: string[],
  importLines: string[],
  vars: string[],
  instantiate = false,
) {
  if (!existsSync(dir)) return;
  collectFiles(dir, (f) => VALID_EXT.includes(extname(f)), files);
  files.forEach((file, idx) => {
    const rel = "../../" + relative(root, file).replace(/\\/g, "/");
    const varName = `${prefix}${idx}`;
    importLines.push(`import ${varName} from "${rel}";`);
    vars.push(instantiate ? `new ${varName}()` : varName);
  });
}

interface CommandGroup {
  name: string;
  groupFile: string;
  subcommands: Array<{ name: string; file: string; varName: string }>;
}

function collectCommandGroups(
  root: string,
  commandsDir: string,
  importLines: string[],
  commandGroups: CommandGroup[],
  commandVars: string[],
  commandFiles: string[],
  setupLines: string[]
) {
  if (!existsSync(commandsDir)) return;

  const items = readdirSync(commandsDir);
  
  for (const item of items) {
    const itemPath = join(commandsDir, item);
    const stats = statSync(itemPath);
    
    if (stats.isDirectory()) {
      const groupName = item;
      const groupPath = itemPath;
      const indexPath = join(groupPath, "index.ts");
      
      if (existsSync(indexPath)) {
        const groupRel = "../../" + relative(root, indexPath).replace(/\\/g, "/");
        const groupVarName = `Group${groupName.charAt(0).toUpperCase() + groupName.slice(1)}`;
        importLines.push(`import ${groupVarName} from "${groupRel}";`);
        
        const subcommands: Array<{ name: string; file: string; varName: string }> = [];
        
        const subItems = readdirSync(groupPath);
        for (const subItem of subItems) {
          if (subItem.endsWith('.ts') && subItem !== 'index.ts') {
            const subcommandName = subItem.replace('.ts', '');
            const subcommandPath = join(groupPath, subItem);
            const subcommandRel = "../../" + relative(root, subcommandPath).replace(/\\/g, "/");
            const subcommandVarName = `Sub${groupName.charAt(0).toUpperCase() + groupName.slice(1)}${subcommandName.charAt(0).toUpperCase() + subcommandName.slice(1)}`;
            
            importLines.push(`import ${subcommandVarName} from "${subcommandRel}";`);
            subcommands.push({
              name: subcommandName,
              file: subcommandPath,
              varName: subcommandVarName
            });
          }
        }
        
        const commandVarName = `Cmd${groupName.charAt(0).toUpperCase() + groupName.slice(1)}`;
        commandVars.push(commandVarName);

        const setupCode = `
// Setup command ${groupName} with subcommands
const ${commandVarName} = new Command()
  .setName("${groupName}")
  .setDescription(${groupVarName}.description || "Commandes ${groupName}");

// Add subcommands directly to command
${subcommands.map(sub => `${commandVarName}.addSubcommand(${sub.varName});`).join('\n')}`;
        
        commandGroups.push({
          name: groupName,
          groupFile: indexPath,
          subcommands
        });
        
        commandFiles.push(indexPath);
        subcommands.forEach(sub => commandFiles.push(sub.file));
        
        setupLines.push(setupCode);
      } else {
        const subItems = readdirSync(groupPath);
        for (const subItem of subItems) {
          if (subItem.endsWith('.ts')) {
            const commandName = subItem.replace('.ts', '');
            const commandPath = join(groupPath, subItem);
            const commandRel = "../../" + relative(root, commandPath).replace(/\\/g, "/");
            const commandVarName = `Cmd${commandName.charAt(0).toUpperCase() + commandName.slice(1)}`;
            
            importLines.push(`import ${commandVarName} from "${commandRel}";`);
            commandVars.push(commandVarName);
            commandFiles.push(commandPath);
          }
        }
      }
    } else if (item.endsWith('.ts')) {
      if (item === "index.ts") return;
      const commandName = item.replace('.ts', '');
      const commandPath = join(commandsDir, item);
      const commandRel = "../../" + relative(root, commandPath).replace(/\\/g, "/");
      const commandVarName = `Cmd${commandName.charAt(0).toUpperCase() + commandName.slice(1)}`;
      
      importLines.push(`import ${commandVarName} from "${commandRel}";`);
      commandVars.push(commandVarName);
      commandFiles.push(commandPath);
    }
  }
}

export async function runBuild(projectRoot: string, opts: { docker?: boolean; js?: boolean } = {}) {
  const root = resolve(process.cwd(), projectRoot ?? ".");

  const cfgFile = ["djsconfig.ts", "djsconfig.js"].find((f) => existsSync(resolve(root, f)));
  if (!cfgFile) {
    throw new Error("djsconfig.ts/js not found in project root");
  }
  const cfgModule = await import(pathToFileURL(resolve(root, cfgFile)).href);
  const config = cfgModule.default ?? cfgModule;

  const pluginManager = new PluginManager((config.plugins ?? []) as DjsCorePlugin[]);
  await pluginManager.runBuildHook({ root, outDir: resolve(root, "dist") });
  await pluginManager.generateTypeDeclarations(root);

  const commandFiles: string[] = [];
  const eventFiles: string[] = [];
  const buttonFiles: string[] = [];

  const importLines: string[] = [];
  const commandVars: string[] = [];
  const eventVars: string[] = [];
  const buttonVars: string[] = [];
  const commandGroups: CommandGroup[] = [];
  const setupLines: string[] = [];

  collectCommandGroups(root, resolve(root, DIRECTORIES.commands), importLines, commandGroups, commandVars, commandFiles, setupLines);
  
  collectAndImportFiles(root, resolve(root, DIRECTORIES.events), "Evt", eventFiles, importLines, eventVars, true);
  collectAndImportFiles(root, resolve(root, DIRECTORIES.buttons), "Btn", buttonFiles, importLines, buttonVars);

  const genDir = resolve(root, GENERATED_DIR);
  await fs.mkdir(genDir, { recursive: true });
  const entryPath = resolve(genDir, "index.ts");

  const cfgRel = "./" + relative(genDir, resolve(root, cfgFile)).replace(/\\/g, "/");
  const cfgImport = `import config from "${cfgRel}";`;

  const handlerContent = `import { Client } from "discord.js";
import { Command } from "djs-core";
${cfgImport}
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
});

client.login(config.token);
`;

  await fs.writeFile(entryPath, handlerContent, { encoding: "utf8" });

  const distDir = resolve(root, "dist");
  const entryGlobs = [entryPath.replace(/\\/g, "/")];
  
  const userPkgPathEarly = resolve(root, "package.json");
  let externalDeps: string[] = ["discord.js", "bun:sqlite"];
  try {
    const userPkgEarly = JSON.parse(await Bun.file(userPkgPathEarly).text());
    externalDeps.push(...Object.keys(userPkgEarly.dependencies ?? {}));
  } catch {}

  await tsupBuild({
    entry: entryGlobs,
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

  try {
    const userPkgPath = resolve(root, "package.json");
    const userPkg = JSON.parse(await Bun.file(userPkgPath).text());
    const runtimeCmd = opts.js ? "node" : "bun";

    const prodPkg = {
      name: userPkg.name ?? "my-bot",
      version: userPkg.version ?? "1.0.0",
      type: "module",
      main: "index.js",
      dependencies: userPkg.dependencies ?? {},
      scripts: {
        ...Object.fromEntries(
          Object.entries(userPkg.scripts ?? {}).filter(([k]) => k !== "build")
        ),
        start: `${runtimeCmd} index.js`
      },
    };
    await fs.writeFile(resolve(distDir, "package.json"), JSON.stringify(prodPkg, null, 2));

    if (opts.docker) {
      const dockerFile = `# ---- DO NOT EDIT THIS FILE UNLESS YOU KNOW WHAT YOU ARE DOING ----\nFROM oven/bun:alpine\nWORKDIR /app\nCOPY . .\nRUN bun i --production\nCMD [\"bun\", \"start\"]\n`;
      await fs.writeFile(resolve(distDir, "Dockerfile"), dockerFile);
    }
  } catch (e) {
    console.warn("⚠️  Failed to copy dependencies to dist/package.json", e);
  }

  await fs.rm(genDir, { recursive: true, force: true });

  await pluginManager.runPostBuildHook({ root, outDir: distDir });

  const finalFile = resolve(distDir, "index.js");
  const sizeKB = ((await fs.stat(finalFile)).size / 1024).toFixed(2);
  const totalInputs = commandFiles.length + eventFiles.length + buttonFiles.length;

  const subcommandGroupCount = commandGroups.length;
  const subcommandCount = commandGroups.reduce((acc, g) => acc + g.subcommands.length, 0);

  const runtimeLabel = opts.js ? "Node.js" : "Bun";

  console.log(`✅ Build completed:
  - Commands: ${commandFiles.length}
  - Subcommand groups: ${subcommandGroupCount}
  - Subcommands: ${subcommandCount}
  - Events: ${eventFiles.length}
  - Buttons: ${buttonFiles.length}
  - Total: ${totalInputs} file(s)
  - Output: dist/index.js (${sizeKB} KB)
  - Runtime: ${runtimeLabel}
  ${opts.docker ? "- Dockerfile generated" : ""}`);
}