import { readdirSync, existsSync } from "fs";
import { resolve, extname, relative } from "path";
import { pathToFileURL } from "url";
import { Client } from "discord.js";
import { registerHandlers } from "../runtime/index.ts";

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
  if (!config.token) {
    console.error("❌ Discord token is missing in djsconfig.ts (token property)");
    process.exit(1);
  }

  const cmdDir = resolve(root, "src/commands");
  const evtDir = resolve(root, "src/events");
  const validExt = [".ts", ".js", ".mjs", ".cjs"];

  async function scanSources() {
    const commandFiles: string[] = [];
    const eventFiles: string[] = [];
    if (existsSync(cmdDir)) collectFiles(cmdDir, (f) => validExt.includes(extname(f)), commandFiles);
    if (existsSync(evtDir)) collectFiles(evtDir, (f) => validExt.includes(extname(f)), eventFiles);

    const commands: any[] = [];
    const events: any[] = [];
    const meta = new Map<string, { name: string }>();

    for (const file of commandFiles) {
      try {
        const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
        if (mod.default) {
          commands.push(mod.default);
          meta.set(file, { name: mod.default.name ?? mod.default?.data?.name ?? "" });
        }
      } catch (err) {
        console.error("Error importing", relative(root, file), err);
      }
    }

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

    console.log(`🔗 ${commands.length} command(s) | ${events.length} event(s) loaded.`);
    return { commands, events, meta };
  }

  let commands: any[] = [];
  let events: any[] = [];
  let fileMeta: Map<string, { name: string }> = new Map();

  async function createClient() {
    ({ commands, events, meta: fileMeta } = await scanSources());

    const client = new Client({ intents: config.intents ?? [] });
    registerHandlers({ client, commands, events });

    client.once("ready", async () => {
      console.log(`✅ Connected as ${client.user?.tag}`);

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
  const watchDirs = [cmdDir, evtDir];
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
          if (mod.default) {
            const newInstance = mod.default;
            const newName = newInstance.name ?? newInstance?.data?.name ?? "";
            if (!prevMeta || prevMeta.name !== newName) {
              majorChange = true;
            }
            if (!majorChange) {
              (currentClient as any)._djsCommands.set(newName, newInstance);
              console.log("🔁 Hot reload applied.");
            }
            fileMeta.set(filePath, { name: newName });
          } else {
            majorChange = true;
          }
        } catch (e) {
          majorChange = true;
        }

        if (majorChange) {
          console.log("♻️ Full restart triggered – resyncing slash commands…");
          try {
            currentClient.destroy();
          } catch {}
          currentClient = await createClient();
        }
      }, 300));
    });
  }
} 