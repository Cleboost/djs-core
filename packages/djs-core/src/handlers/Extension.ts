/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Extension, ExtensionManifest, ExtensionDev, ExtensionRuntime } from "../class/Extension";
import BotClient from "../class/BotClient";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { underline } from "chalk";
import { Collection } from "discord.js";

export default class ExtensionHandler {
  private client: BotClient;
  private extensions: Collection<string, Extension> = new Collection();
  private loadedDevExtensions: Collection<string, ExtensionDev> = new Collection();
  private loadedRuntimeExtensions: Collection<string, ExtensionRuntime> = new Collection();

  constructor(client: BotClient) {
    this.client = client;
  }

  /**
   * Load extensions from a directory
   */
  async loadExtensions(extensionsDir: string = "extensions"): Promise<void> {
    const extensionsPath = path.join(this.client.cwdPath, extensionsDir);
    
    if (!fs.existsSync(extensionsPath)) {
      this.client.logger.info("No extensions directory found, skipping extension loading");
      return;
    }

    const extensionDirs = fs.readdirSync(extensionsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const extensionDir of extensionDirs) {
      await this.loadExtension(path.join(extensionsPath, extensionDir));
    }
  }

  /**
   * Load a single extension
   */
  async loadExtension(extensionPath: string): Promise<void> {
    try {
      // Check for manifest file
      const manifestPath = path.join(extensionPath, "manifest.json");
      if (!fs.existsSync(manifestPath)) {
        this.client.logger.warn(`Extension at ${extensionPath} missing manifest.json, skipping`);
        return;
      }

      const manifest: ExtensionManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      
      // Validate manifest
      if (!this.validateManifest(manifest)) {
        return;
      }

      // Check for incompatibilities
      if (this.checkIncompatibilities(manifest)) {
        return;
      }

      const extension: Extension = { manifest };

      // Load development part if in dev mode
      if (this.client.devMode) {
        const devPath = path.join(extensionPath, "dev.ts");
        if (fs.existsSync(devPath)) {
          const devModule = await import(pathToFileURL(devPath).href);
          if (devModule.default) {
            extension.dev = new devModule.default();
            if (extension.dev) {
              await extension.dev.onLoad();
              this.loadedDevExtensions.set(manifest.packageId, extension.dev);
            }
          }
        }
      }

      // Load runtime part
      const runtimePath = this.client.devMode 
        ? path.join(extensionPath, "runtime.ts")
        : path.join(extensionPath, "runtime.js");
      
      if (fs.existsSync(runtimePath)) {
        const runtimeModule = await import(pathToFileURL(runtimePath).href);
        if (runtimeModule.default) {
          extension.runtime = new runtimeModule.default();
          if (extension.runtime) {
            await extension.runtime.onInit();
            this.loadedRuntimeExtensions.set(manifest.packageId, extension.runtime);
          }
        }
      }

      this.extensions.set(manifest.packageId, extension);
      this.client.logger.success(`Extension ${underline(manifest.name)} v${manifest.version} loaded successfully`);

    } catch (error) {
      this.client.logger.error(new Error(`Failed to load extension at ${extensionPath}: ${error}`));
    }
  }

  /**
   * Unload an extension
   */
  async unloadExtension(packageId: string): Promise<void> {
    const extension = this.extensions.get(packageId);
    if (!extension) {
      this.client.logger.warn(`Extension ${packageId} not found`);
      return;
    }

    try {
      // Unload dev part
      const devExtension = this.loadedDevExtensions.get(packageId);
      if (devExtension) {
        await devExtension.onUnload();
        this.loadedDevExtensions.delete(packageId);
      }

      // Unload runtime part
      const runtimeExtension = this.loadedRuntimeExtensions.get(packageId);
      if (runtimeExtension && runtimeExtension.onShutdown) {
        await runtimeExtension.onShutdown();
        this.loadedRuntimeExtensions.delete(packageId);
      }

      this.extensions.delete(packageId);
      this.client.logger.success(`Extension ${underline(extension.manifest.name)} unloaded successfully`);

    } catch (error) {
      this.client.logger.error(new Error(`Failed to unload extension ${packageId}: ${error}`));
    }
  }

  /**
   * Reload an extension (dev mode only)
   */
  async reloadExtension(packageId: string): Promise<void> {
    if (!this.client.devMode) {
      this.client.logger.warn("Extension reloading is only available in development mode");
      return;
    }

    const extension = this.extensions.get(packageId);
    if (!extension) {
      this.client.logger.warn(`Extension ${packageId} not found`);
      return;
    }

    const devExtension = this.loadedDevExtensions.get(packageId);
    if (devExtension) {
      try {
        await devExtension.onReload();
        this.client.logger.success(`Extension ${underline(extension.manifest.name)} reloaded successfully`);
      } catch (error) {
        this.client.logger.error(new Error(`Failed to reload extension ${packageId}: ${error}`));
      }
    }
  }

  /**
   * Get list of loaded extensions
   */
  listExtensions(): Extension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Get extension by package ID
   */
  getExtension(packageId: string): Extension | undefined {
    return this.extensions.get(packageId);
  }

  /**
   * Shutdown all extensions
   */
  async shutdown(): Promise<void> {
    for (const [packageId] of this.extensions) {
      await this.unloadExtension(packageId);
    }
  }

  /**
   * Validate extension manifest
   */
  private validateManifest(manifest: ExtensionManifest): boolean {
    if (!manifest.name || !manifest.version || !manifest.author || !manifest.packageId) {
      this.client.logger.error(new Error("Extension manifest is missing required fields (name, version, author, packageId)"));
      return false;
    }

    // Check if packageId is already in use
    if (this.extensions.has(manifest.packageId)) {
      this.client.logger.error(new Error(`Extension with packageId ${manifest.packageId} is already loaded`));
      return false;
    }

    return true;
  }

  /**
   * Check for extension incompatibilities
   */
  private checkIncompatibilities(manifest: ExtensionManifest): boolean {
    if (!manifest.incompatible || manifest.incompatible.length === 0) {
      return false;
    }

    for (const incompatibleId of manifest.incompatible) {
      if (this.extensions.has(incompatibleId)) {
        const incompatibleExt = this.extensions.get(incompatibleId)!;
        this.client.logger.error(
          new Error(`Extension ${manifest.name} is incompatible with loaded extension ${incompatibleExt.manifest.name}`)
        );
        return true;
      }
    }

    return false;
  }
}