/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { Config } from "./config";
import { BundlerReadable } from "./readable";

interface ExtensionManifest {
  name: string;
  version: string;
  author: string;
  packageId: string;
  description?: string;
  incompatible?: string[];
  djsCoreVersion?: string;
  dependencies?: Record<string, string>;
}

interface ExtensionBuildModule {
  default: unknown;
  manifest: ExtensionManifest;
}

export async function processExtensions(
  config: Config,
  stream: BundlerReadable,
): Promise<void> {
  if (config.processExtensions === false) {
    return;
  }

  const extensionsDir = config.extensionsDir || "extensions";
  const extensionsPath = path.resolve(extensionsDir);

  if (!fs.existsSync(extensionsPath)) {
    if (config.log === "extend" || config.log === "debug") {
      stream.emit("step", {
        id: "extensions",
        status: "progress",
        message: "No extensions directory found, skipping extension processing",
      });
    }
    return;
  }

  stream.emit("step", { id: "extensions", status: "start" });

  try {
    const extensionDirs = fs
      .readdirSync(extensionsPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const extensionDir of extensionDirs) {
      await processExtension(
        path.join(extensionsPath, extensionDir),
        config,
        stream,
      );
    }

    stream.emit("step", { id: "extensions", status: "done" });
  } catch (error) {
    stream.emit("step", {
      id: "extensions",
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unknown error during extension processing",
    });
  }
}

async function processExtension(
  extensionPath: string,
  config: Config,
  stream: BundlerReadable,
): Promise<void> {
  try {
    // Check for manifest
    const manifestPath = path.join(extensionPath, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
      if (config.log === "extend" || config.log === "debug") {
        stream.emit("step", {
          id: "extensions",
          status: "progress",
          message: `Extension at ${extensionPath} missing manifest.json, skipping`,
        });
      }
      return;
    }

    const manifest: ExtensionManifest = JSON.parse(
      fs.readFileSync(manifestPath, "utf-8"),
    );

    if (config.log === "extend") {
      stream.emit("step", {
        id: "extensions",
        status: "progress",
        message: `Processing extension ${manifest.name} v${manifest.version}`,
      });
    }

    // Check for build file
    const buildPath = path.join(extensionPath, "build.ts");
    if (fs.existsSync(buildPath)) {
      const buildModule: ExtensionBuildModule = await import(
        pathToFileURL(buildPath).href
      );
      if (buildModule.default) {
        const buildExtension = new buildModule.default();

        // Call pre-build hook
        if (buildExtension.onPreBuild) {
          await buildExtension.onPreBuild(config);
        }

        // Process additional files
        if (buildExtension.onAddFiles) {
          const additionalFiles = await buildExtension.onAddFiles();
          if (Array.isArray(additionalFiles)) {
            for (const file of additionalFiles) {
              const filePath = path.resolve(file);
              if (fs.existsSync(filePath)) {
                const destPath = `${config.dist || "dist"}/${path.basename(file)}`;
                fs.copyFileSync(filePath, destPath);

                if (config.log === "extend") {
                  stream.emit("step", {
                    id: "extensions",
                    status: "progress",
                    message: `Added file ${file} from extension ${manifest.name}`,
                  });
                }
              }
            }
          }
        }

        // Call post-build hook (will be called after main build)
        if (buildExtension.onPostBuild) {
          // Store for later execution
          (config as Record<string, unknown>).__extensionPostBuildHooks =
            (config as Record<string, unknown>).__extensionPostBuildHooks || [];
          (
            (config as Record<string, unknown>)
              .__extensionPostBuildHooks as (() => void)[]
          ).push(() => buildExtension.onPostBuild!(config));
        }
      }
    }

    // Copy runtime files to dist for bundling
    const runtimePath = path.join(extensionPath, "runtime.ts");
    if (fs.existsSync(runtimePath)) {
      const destPath = `${config.dist || "dist"}/extensions/${manifest.packageId}/runtime.js`;
      const destDir = path.dirname(destPath);

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Copy the file (it will be processed by the main build)
      config.files.push(runtimePath);

      if (config.log === "extend") {
        stream.emit("step", {
          id: "extensions",
          status: "progress",
          message: `Added runtime file for extension ${manifest.name}`,
        });
      }
    }

    // Copy manifest to dist
    const manifestDestPath = `${config.dist || "dist"}/extensions/${manifest.packageId}/manifest.json`;
    const manifestDestDir = path.dirname(manifestDestPath);

    if (!fs.existsSync(manifestDestDir)) {
      fs.mkdirSync(manifestDestDir, { recursive: true });
    }

    fs.copyFileSync(manifestPath, manifestDestPath);
  } catch (error) {
    stream.emit("step", {
      id: "extensions",
      status: "error",
      message: `Failed to process extension at ${extensionPath}: ${error}`,
    });
  }
}

export async function callPostBuildHooks(config: Config): Promise<void> {
  const hooks = (config as Record<string, unknown>).__extensionPostBuildHooks;
  if (Array.isArray(hooks)) {
    for (const hook of hooks) {
      try {
        await hook();
      } catch (error) {
        console.warn(`Extension post-build hook failed: ${error}`);
      }
    }
  }
}
