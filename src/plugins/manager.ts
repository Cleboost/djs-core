import { promises as fs } from "fs";
import { resolve, relative, isAbsolute, dirname } from "path";
import type { Client } from "discord.js";
import type { BuildContext, DevContext, DjsCorePlugin } from "./types.ts";

export class PluginManager {
  constructor(private readonly plugins: DjsCorePlugin[]) {}

  async runDevHook(ctx: DevContext) {
    await this.ensureRuntimeDeps(ctx.root);
    for (const p of this.plugins) {
      try {
        await p.onDev?.(ctx);
      } catch (err) {
        console.error(`❌ [plugin:${p.name}] Erreur dans onDev :`, err);
      }
    }
  }

  async runBuildHook(ctx: BuildContext) {
    await this.ensureRuntimeDeps(ctx.root);
    for (const p of this.plugins) {
      try {
        await p.onBuild?.(ctx);
      } catch (err) {
        console.error(`❌ [plugin:${p.name}] Erreur dans onBuild :`, err);
      }
    }
  }

  private async ensureRuntimeDeps(projectRoot: string) {
    const pkgPath = resolve(projectRoot, "package.json");
    type PackageJson = {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      [key: string]: unknown;
    };
    let pkgJson: PackageJson;
    try {
      pkgJson = JSON.parse(await fs.readFile(pkgPath, "utf8"));
    } catch {
      return; 
    }

    let modified = false;
    pkgJson.dependencies ??= {};
    pkgJson.devDependencies ??= {};

    for (const plugin of this.plugins) {
      // runtime deps
      for (const [dep, ver] of Object.entries(plugin.runtimeDeps ?? {})) {
        if (!pkgJson.dependencies[dep]) {
          pkgJson.dependencies[dep] = ver;
          modified = true;
          console.log(`📦 Adding runtime dependency '${dep}@${ver}' (via plugin ${plugin.name})`);
        }
      }

      for (const [dep, ver] of Object.entries(plugin.devDeps ?? {})) {
        if (!pkgJson.devDependencies[dep] && !pkgJson.dependencies[dep]) {
          pkgJson.devDependencies[dep] = ver;
          modified = true;
          console.log(`🔧 Adding dev dependency '${dep}@${ver}' (via plugin ${plugin.name})`);
        }
      }
    }

    if (modified) {
      try {
        await fs.writeFile(pkgPath, JSON.stringify(pkgJson, null, 2));
        console.log("\n🔄 package.json updated. Please run:\n\n  bun install\n\nthen re-run your command.\n");
      } catch (err) {
        console.warn("⚠️  Unable to update package.json", err);
      }

      process.exit(0);
    }
  }

  async setupClient(client: Client, projectRoot?: string) {
    for (const p of this.plugins) {
      try {
        await p.setupClient?.(client, projectRoot);
      } catch (err) {
        console.error(`❌ [plugin:${p.name}] Error in setupClient :`, err);
      }
    }
  }

  async generateTypeDeclarations(projectRoot: string) {
    const parts: string[] = [];
    for (const p of this.plugins) {
      const decl = p.extendTypes?.();
      if (decl && decl.trim()) {
        parts.push(`// ---- Injected types by ${p.name} ----\n` + decl.trim());
      }
    }
    if (parts.length === 0) return;

    const content = parts.join("\n\n");
    const dir = resolve(projectRoot, ".djs-core/injected-types");
    try {
      await fs.mkdir(dir, { recursive: true });
      const filePath = resolve(dir, "djs-plugin-types.d.ts");
      await fs.writeFile(filePath, content, { encoding: "utf8" });

      const rootTypesPath = resolve(projectRoot, "djs-core-types.d.ts");
      const relativeToRoot = relative(projectRoot, filePath).replace(/\\/g, "/");
      const refContent = `/// <reference path=\"./${relativeToRoot}\" />\n`;
      await fs.writeFile(rootTypesPath, refContent, { encoding: "utf8" });

      const gitignorePath = resolve(projectRoot, ".gitignore");
      const gitignoreExists = await fs.stat(gitignorePath).then(() => true).catch(() => false);
      if (gitignoreExists) {
        const ignoreEntries = [".djs-core/", "djs-core-types.d.ts"];
        const existing = await fs.readFile(gitignorePath, "utf8");
        const toAppend = ignoreEntries.filter((e) => !existing.includes(e));
        if (toAppend.length) {
          await fs.appendFile(gitignorePath, (existing.endsWith("\n") ? "" : "\n") + toAppend.join("\n") + "\n");
        }
      }
    } catch (err) {
      console.error("⚠️  Unable to write injected types:", err);
    }
  }

  async copyArtifacts(projectRoot: string, outDir: string) {
    for (const plugin of this.plugins) {
      for (const item of plugin.buildArtifacts ?? []) {
        const src = isAbsolute(item) ? item : resolve(projectRoot, item);
        const dest = resolve(outDir, relative(projectRoot, src));
        try {
          const stat = await fs.stat(src);
          if (stat.isFile()) {
            await fs.mkdir(dirname(dest), { recursive: true });
            await fs.copyFile(src, dest);
          } else if (stat.isDirectory()) {
            await this.copyDirRecursive(src, dest);
          }
        } catch {}
      }
    }
  }

  async runPostBuildHook(ctx: BuildContext) {
    for (const p of this.plugins) {
      try {
        await p.onPostBuild?.(ctx);
      } catch (err) {
        console.error(`❌ [plugin:${p.name}] Erreur dans onPostBuild :`, err);
      }
    }
  }

  private async copyDirRecursive(srcDir: string, destDir: string) {
    await fs.mkdir(destDir, { recursive: true });
    for (const entry of await fs.readdir(srcDir, { withFileTypes: true })) {
      const srcPath = resolve(srcDir, entry.name);
      const destPath = resolve(destDir, entry.name);
      if (entry.isDirectory()) {
        await this.copyDirRecursive(srcPath, destPath);
      } else if (entry.isFile()) {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
} 