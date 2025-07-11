import { readdirSync, existsSync } from "fs";
import { resolve, extname, relative } from "path";
import { pathToFileURL } from "url";
import { Client } from "discord.js";
import { PluginManager } from "../plugins/manager.ts";
import { registerHandlers, Command, SubCommand, SubCommandGroup } from "../runtime/index.ts";
import type { DjsCorePlugin } from "../plugins/types.ts";

type AnyPlugin = DjsCorePlugin;

async function collectFiles(dir: string, matcher: (file: string) => boolean, acc: string[]) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(fullPath, matcher, acc);
    } else if (entry.isFile() && matcher(fullPath)) {
      acc.push(fullPath);
    }
  }
}

export async function runDev(projectRoot: string) {
  const root = resolve(process.cwd(), projectRoot ?? ".");

  const envPath = resolve(root, ".env");
  if (existsSync(envPath)) {
    const content = await Bun.file(envPath).text();
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    }
  }

  const cfgPathTs = resolve(root, "djsconfig.ts");
  const cfgPathJs = resolve(root, "djsconfig.js");
  let cfgModule: any;
  if (existsSync(cfgPathTs)) {
    cfgModule = await import(pathToFileURL(cfgPathTs).href + `?t=${Date.now()}`);
  } else if (existsSync(cfgPathJs)) {
    cfgModule = await import(pathToFileURL(cfgPathJs).href + `?t=${Date.now()}`);
  } else {
    console.error("❌ No 'djsconfig.(ts|js)' configuration found in", root);
    process.exit(1);
  }
  const config = cfgModule.default ?? cfgModule;

  const pluginManager = new PluginManager((config.plugins ?? []) as AnyPlugin[]);
  await pluginManager.runDevHook({ root });
  await pluginManager.generateTypeDeclarations(root);
  if (!config.token) {
    console.error("❌ Discord token is missing in djsconfig.ts (token property)");
    process.exit(1);
  }

  const cmdDir = resolve(root, "src/commands");
  const evtDir = resolve(root, "src/events");
  const btnDir = resolve(root, "src/buttons");
  const selDir = resolve(root, "src/selects");
  const validExt = [".ts", ".js", ".mjs", ".cjs"];

  async function scanSources() {
    const commandFiles: string[] = [];
    const eventFiles: string[] = [];
    const buttonFiles: string[] = [];
    const selectFiles: string[] = [];
    if (existsSync(cmdDir)) collectFiles(cmdDir, (f) => validExt.includes(extname(f)), commandFiles);
    if (existsSync(evtDir)) collectFiles(evtDir, (f) => validExt.includes(extname(f)), eventFiles);
    if (existsSync(btnDir)) collectFiles(btnDir, (f) => validExt.includes(extname(f)), buttonFiles);
    if (existsSync(selDir)) collectFiles(selDir, (f) => validExt.includes(extname(f)), selectFiles);

    const events: any[] = [];
    const buttons: any[] = [];
    const selectMenus: any[] = [];

    const rawCommandInstances: Array<{ instance: any; file: string }> = [];
    const meta = new Map<string, { name: string }>();

    for (const file of commandFiles) {
      try {
        const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
        if (mod.default) {
          rawCommandInstances.push({ instance: mod.default, file });
          meta.set(file, { name: mod.default.name ?? mod.default?.data?.name ?? "" });
        }
      } catch (err) {
        console.error("Error importing", relative(root, file), err);
      }
    }

    const commandMap = new Map<string, Command>();
    const subcommandBuffer: SubCommand[] = [];

    for (const { instance } of rawCommandInstances) {
      if (instance instanceof Command) {
        commandMap.set(instance.name, instance);
      }
    }

    const groupDescriptionMap = new Map<string, string>();
    for (const { instance } of rawCommandInstances) {
      if (instance instanceof SubCommand) {
        subcommandBuffer.push(instance);
      } else if (instance instanceof SubCommandGroup) {
        groupDescriptionMap.set(instance.name, (instance as any).description ?? "");
      }
    }

    for (const sub of subcommandBuffer) {
      const parent = sub.getParent?.();
      if (!parent) continue;
      let cmd = commandMap.get(parent);
      if (!cmd) {
        const desc = groupDescriptionMap.get(parent) || `Command ${parent}`;
        cmd = new Command().setName(parent).setDescription(desc);
        commandMap.set(parent, cmd);
      }
      if (!(cmd as any).getSubcommand?.(sub.name)) {
        cmd.addSubcommand(sub);
      }
    }

    const commands = Array.from(commandMap.values());

    for (const file of eventFiles) {
      try {
        const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
        if (!mod.default) continue;
        let instance: any;
        if (typeof mod.default === "function") {
          instance = new mod.default();
        } else {
          instance = mod.default;
        }
        events.push(instance);
      } catch (err) {
        console.error("Error importing", relative(root, file), err);
      }
    }

    for (const file of buttonFiles) {
      try {
        const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
        if (mod.default) {
          buttons.push(mod.default);
        }
      } catch (err) {
        console.error("Error importing", relative(root, file), err);
      }
    }

    for (const file of selectFiles) {
      try {
        const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
        if (mod.default) {
          selectMenus.push(mod.default);
        }
      } catch (err) {
        console.error("Error importing", relative(root, file), err);
      }
    }

    console.log(`🔗 ${commands.length} command${commands.length === 1 ? "" : "s"} | ${events.length} event${events.length === 1 ? "" : "s"} | ${buttons.length} button${buttons.length === 1 ? "" : "s"} | ${selectMenus.length} select${selectMenus.length === 1 ? "" : "s"} loaded.`);
    return { commands, events, buttons, selectMenus, meta };
  }

  let commands: any[] = [];
  let events: any[] = [];
  let buttons: any[] = [];
  let selectMenus: any[] = [];
  let fileMeta: Map<string, { name: string }> = new Map();

  async function createClient() {
    ({ commands, events, buttons, selectMenus, meta: fileMeta } = await scanSources());

    const client = new Client({ intents: config.intents ?? [] });

    await pluginManager.setupClient(client, root);

    registerHandlers({ client, commands, events, buttons, selectMenus });

    client.once("ready", async () => {
      const jsonData = commands.map((c: any) => c.toJSON?.() ?? null).filter(Boolean);
      if (jsonData.length === 0) {
        console.warn("⚠️  No commands to deploy.");
        return;
      }

      try {
        if (Array.isArray(config.guildIds) && config.guildIds.length > 0) {
          await Promise.all(
            config.guildIds.map(async (id: string) => {
              const guild = await client.guilds.fetch(id);
              await guild.commands.set(jsonData as any);
              console.log(`🚀 Commands deployed to ${guild.name} (${id})`);
            }),
          );
        } else {
          await client.application?.commands.set(jsonData as any);
          console.log("🚀 Global commands deployed (propagation may take up to 1 hour).");
        }
      } catch (err) {
        console.error("❌ Failed to deploy slash-commands:", err);
      }
    });

    await client.login(config.token);

    return client;
  }

  let currentClient = await createClient();

  const debounceMap = new Map<string, NodeJS.Timeout>();

  const { watch } = await import("fs");
  const watchDirs = [cmdDir, evtDir, btnDir, selDir];
  for (const dir of watchDirs) {
    if (!existsSync(dir)) continue;
    watch(dir, { recursive: true }, (eventType, filename) => {
      if (!filename || !validExt.includes(extname(filename))) return;
      const filePath = resolve(dir, filename);
      if (debounceMap.has(filePath)) clearTimeout(debounceMap.get(filePath)!);
      debounceMap.set(filePath, setTimeout(async () => {
        console.log(`🔄 Change detected in ${relative(root, filePath)}`);

        const prevMeta = fileMeta.get(filePath);
        let majorChange = false;
        try {
          delete require.cache[require.resolve(filePath)];
          const mod = await import(pathToFileURL(filePath).href + `?t=${Date.now()}`);

          const isCommandFile = filePath.startsWith(cmdDir);
          const isButtonFile = filePath.startsWith(btnDir);
          const isSelectFile = filePath.startsWith(selDir);

          if (isCommandFile && mod.default) {
            const newInstance = mod.default;
            const isSubCmd = typeof (newInstance as any).getParent === "function";
            if (isSubCmd) {
              majorChange = true;
            } else {
              const newName = newInstance.name ?? newInstance?.data?.name ?? "";
              if (!prevMeta || prevMeta.name !== newName) {
                majorChange = true;
              }
              if (!majorChange) {
                (currentClient as any)._djsCommands.set(newName, newInstance);
                console.log("🔁 Command hot reload applied.");
              }
              fileMeta.set(filePath, { name: newName });
            }
          } else if (isButtonFile && mod.default) {
            const newInstance = mod.default;
            const id = (newInstance as any).customId ?? "";
            (currentClient as any)._djsButtons.set(id, newInstance);
            console.log("🔁 Button hot reload applied.");
          } else if (isSelectFile && mod.default) {
            const newInstance = mod.default;
            const id = (newInstance as any).customId ?? "";
            (currentClient as any)._djsSelectMenus.set(id, newInstance);
            console.log("🔁 Select menu hot reload applied.");
          } else {
            majorChange = true;
          }
        } catch (e) {
          majorChange = true;
        }

        if (majorChange) {
          console.log("♻️ Full restart triggered – resyncing handlers…");
          try {
            currentClient.destroy();
          } catch {}
          currentClient = await createClient();
        }
      }, 500));
    });
  }
}