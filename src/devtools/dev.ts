import { readdirSync, existsSync } from "fs";
import { resolve, extname, relative } from "path";
import { pathToFileURL } from "url";
import { Client } from "discord.js";
import type { RESTPostAPIChatInputApplicationCommandsJSONBody, RESTPostAPIContextMenuApplicationCommandsJSONBody } from "discord.js";
import type { BaseEvent, Button, SelectMenu, Modal, ContextMenu } from "../runtime/index.ts";
import { PluginManager } from "../plugins/manager.ts";
import { registerHandlers, Command, SubCommand, SubCommandGroup } from "../runtime/index.ts";
import type { DjsCorePlugin } from "../plugins/types.ts";

type AnyPlugin = DjsCorePlugin;
interface UserConfig {
  token: string;
  intents?: unknown;
  plugins?: AnyPlugin[];
  guildIds?: string[];
}

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
  let cfgModule: unknown;
  if (existsSync(cfgPathTs)) {
    cfgModule = await import(pathToFileURL(cfgPathTs).href + `?t=${Date.now()}`);
  } else if (existsSync(cfgPathJs)) {
    cfgModule = await import(pathToFileURL(cfgPathJs).href + `?t=${Date.now()}`);
  } else {
    console.error("❌ No 'djsconfig.(ts|js)' configuration found in", root);
    process.exit(1);
  }
  const config: UserConfig = (cfgModule as { default?: UserConfig }).default ?? (cfgModule as UserConfig);

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
  const modalDir = resolve(root, "src/modals");
  const ctxDir = resolve(root, "src/contexts");
  const validExt = [".ts", ".js", ".mjs", ".cjs"];

  async function scanSources() {
    const commandFiles: string[] = [];
    const eventFiles: string[] = [];
    const buttonFiles: string[] = [];
    const selectFiles: string[] = [];
    const modalFiles: string[] = [];
    const contextMenuFiles: string[] = [];

    if (existsSync(cmdDir)) collectFiles(cmdDir, (f) => validExt.includes(extname(f)), commandFiles);
    if (existsSync(evtDir)) collectFiles(evtDir, (f) => validExt.includes(extname(f)), eventFiles);
    if (existsSync(btnDir)) collectFiles(btnDir, (f) => validExt.includes(extname(f)), buttonFiles);
    if (existsSync(selDir)) collectFiles(selDir, (f) => validExt.includes(extname(f)), selectFiles);
    if (existsSync(modalDir)) collectFiles(modalDir, (f) => validExt.includes(extname(f)), modalFiles);
    if (existsSync(ctxDir)) collectFiles(ctxDir, (f) => validExt.includes(extname(f)), contextMenuFiles);

    const events: BaseEvent[] = [];
    const buttons: Button[] = [];
    const selectMenus: SelectMenu[] = [];
    const modals: Modal[] = [];
    const contextMenus: ContextMenu[] = [];

    const rawCommandInstances: Array<{ instance: Command | SubCommand | SubCommandGroup; file: string }> = [];
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
        groupDescriptionMap.set(instance.name, (instance as { description?: string }).description ?? "");
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
      if (!cmd.getSubcommand?.(sub.name)) {
        cmd.addSubcommand(sub);
      }
    }

    const commands = Array.from(commandMap.values());

    const subcommandCount = subcommandBuffer.length;
    const groupCount = groupDescriptionMap.size;

    for (const file of eventFiles) {
      try {
        const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
        if (!mod.default) continue;
        let instance: unknown;
        if (typeof mod.default === "function") {
          instance = new mod.default();
        } else {
          instance = mod.default;
        }
        if (instance && typeof (instance as BaseEvent).execute === "function") {
          events.push(instance as BaseEvent);
        }
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

    for (const file of modalFiles) {
      try {
        const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
        if (mod.default) {
          modals.push(mod.default);
        }
      } catch (err) {
        console.error("Error importing", relative(root, file), err);
      }
    }

    for (const file of contextMenuFiles) {
      try {
        const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
        if (mod.default) {
          contextMenus.push(mod.default);
        }
      } catch (err) {
        console.error("Error importing", relative(root, file), err);
      }
    }

    console.log(`🔗 ${commands.length} command${commands.length === 1 ? "" : "s"} | ${groupCount} group${groupCount === 1 ? "" : "s"} | ${subcommandCount} subcommand${subcommandCount === 1 ? "" : "s"} | ${events.length} event${events.length === 1 ? "" : "s"} | ${buttons.length} button${buttons.length === 1 ? "" : "s"} | ${selectMenus.length} select${selectMenus.length === 1 ? "" : "s"} | ${modals.length} modal${modals.length === 1 ? "" : "s"} | ${contextMenus.length} context menu${contextMenus.length === 1 ? "" : "s"} loaded.`);
    return { commands, events, buttons, selectMenus, modals, contextMenus, meta };
  }

  let commands: Command[] = [];
  let events: BaseEvent[] = [];
  let buttons: Button[] = [];
  let selectMenus: SelectMenu[] = [];
  let modals: Modal[] = [];
  let contextMenus: ContextMenu[] = [];
  let fileMeta: Map<string, { name: string }> = new Map();

  async function createClient() {
    ({ commands, events, buttons, selectMenus, modals, contextMenus, meta: fileMeta } = await scanSources());

    const client = new Client({ intents: (config.intents as number[] | undefined) ?? [] });

    await pluginManager.setupClient(client, root);

    registerHandlers({ client, commands, events, buttons, selectMenus, modals, contextMenus });

    client.once("ready", async () => {
      const commandJsonData = commands.map((c) => c.toJSON?.() ?? null).filter(Boolean);
      const contextMenuJsonData = contextMenus.map((c) => c.toJSON?.() ?? null).filter(Boolean);
      const allCommands = [...commandJsonData, ...contextMenuJsonData] as (RESTPostAPIChatInputApplicationCommandsJSONBody | RESTPostAPIContextMenuApplicationCommandsJSONBody)[];
      if (allCommands.length === 0) {
        console.warn("⚠️  No commands to deploy.");
        return;
      }

      try {
        if (Array.isArray(config.guildIds) && config.guildIds.length > 0) {
          await Promise.all(
            config.guildIds.map(async (id: string) => {
              const guild = await client.guilds.fetch(id);
              await guild.commands.set(allCommands);
              console.log(`🚀 Commands deployed to ${guild.name} (${id})`);
            }),
          );
        } else {
          await client.application?.commands.set(allCommands);
          console.log("🚀 Global commands deployed (propagation may take up to 1 hour).");
        }
      } catch (err) {
        console.error("❌ Failed to deploy application commands:", err);
      }
    });

    await client.login(config.token);

    return client;
  }

  let currentClient = await createClient();

  const debounceMap = new Map<string, ReturnType<typeof setTimeout>>();

  const { watch } = await import("fs");
  const watchDirs = [cmdDir, evtDir, btnDir, selDir, modalDir, ctxDir];
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
          const isModalFile = filePath.startsWith(modalDir);
          const isContextMenuFile = filePath.startsWith(ctxDir);

          if (isCommandFile && mod.default) {
            const newInstance = mod.default;
            const isSubCmd = typeof (newInstance as SubCommand).getParent === "function";
            if (isSubCmd) {
              majorChange = true;
            } else {
              const newName = newInstance.name ?? newInstance?.data?.name ?? "";
              if (!prevMeta || prevMeta.name !== newName) {
                majorChange = true;
              }
              if (!majorChange) {
                (currentClient as ExtendedClient)._djsCommands.set(newName, newInstance);
                console.log("🔁 Command hot reload applied.");
              }
              fileMeta.set(filePath, { name: newName });
            }
          } else if (isButtonFile && mod.default) {
            const newInstance = mod.default;
            const id = (newInstance as Button).customId ?? "";
            (currentClient as ExtendedClient)._djsButtons.set(id, newInstance);
            console.log("🔁 Button hot reload applied.");
          } else if (isSelectFile && mod.default) {
            const newInstance = mod.default;
            const id = (newInstance as SelectMenu).customId ?? "";
            (currentClient as ExtendedClient)._djsSelectMenus.set(id, newInstance);
            console.log("🔁 Select menu hot reload applied.");
          } else if (isModalFile && mod.default) {
            const newInstance = mod.default;
            const id = (newInstance as Modal).customId ?? "";
            (currentClient as ExtendedClient)._djsModals.set(id, newInstance);
            console.log("🔁 Modal hot reload applied.");
          } else if (isContextMenuFile && mod.default) {
            const newInstance = mod.default;
            const nameId = (newInstance as ContextMenu).name;
            (currentClient as ExtendedClient)._djsContextMenus.set(nameId, newInstance);
            console.log("🔁 Context menu hot reload applied.");
          } else {
            majorChange = true;
          }
        } catch {
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

type ExtendedClient = Client & {
  _djsCommands: Map<string, Command>;
  _djsButtons: Map<string, Button>;
  _djsSelectMenus: Map<string, SelectMenu>;
  _djsModals: Map<string, Modal>;
  _djsContextMenus: Map<string, ContextMenu>;
};