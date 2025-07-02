/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

export interface ExtensionManifest {
  /**
   * Name of the extension
   */
  name: string;
  /**
   * Version of the extension (semver)
   */
  version: string;
  /**
   * Author of the extension
   */
  author: string;
  /**
   * Package ID for the extension
   */
  packageId: string;
  /**
   * Description of the extension
   */
  description?: string;
  /**
   * Extensions that are incompatible with this one
   */
  incompatible?: string[];
  /**
   * Required djs-core version (semver range)
   */
  djsCoreVersion?: string;
  /**
   * Extension dependencies
   */
  dependencies?: Record<string, string>;
}

/**
 * Base class for extension development code
 * Handles hot reload functionality
 */
export abstract class ExtensionDev {
  abstract manifest: ExtensionManifest;
  
  /**
   * Called when the extension is loaded in development mode
   */
  abstract onLoad(): void | Promise<void>;
  
  /**
   * Called when the extension is unloaded in development mode
   */
  abstract onUnload(): void | Promise<void>;
  
  /**
   * Called when the extension is reloaded in development mode
   */
  onReload(): void | Promise<void> {
    return Promise.resolve();
  }
}

/**
 * Base class for extension build code
 * Handles build-time interactions
 */
export abstract class ExtensionBuild {
  abstract manifest: ExtensionManifest;
  
  /**
   * Called before the build starts
   */
  onPreBuild?(config: unknown): void | Promise<void>;
  
  /**
   * Called after the build completes
   */
  onPostBuild?(config: unknown): void | Promise<void>;
  
  /**
   * Called to transform files during build
   */
  onTransform?(filePath: string, content: string): string | Promise<string>;
  
  /**
   * Called to add files to the build
   */
  onAddFiles?(): string[] | Promise<string[]>;
}

/**
 * Base class for extension runtime code
 * This gets bundled in production mode
 */
export abstract class ExtensionRuntime {
  abstract manifest: ExtensionManifest;
  
  /**
   * Called when the extension is initialized at runtime
   */
  abstract onInit(): void | Promise<void>;
  
  /**
   * Called when the bot shuts down
   */
  onShutdown?(): void | Promise<void>;
}

/**
 * Extension wrapper that contains all three parts
 */
export interface Extension {
  manifest: ExtensionManifest;
  dev?: ExtensionDev;
  build?: ExtensionBuild;
  runtime?: ExtensionRuntime;
}