/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { build } from "tsup";
import { Config } from "./config";
import { Readable } from "stream";
import fs from "fs";
import { BundlerReadable } from "./readable";
import { obfuscate } from "javascript-obfuscator";
import { processExtensions, callPostBuildHooks } from "./extensions";

function bundleBot(config: Config): BundlerReadable {
  const stream = new Readable({
    read() {},
  }) as BundlerReadable;

  if (config.files.length === 0) {
    stream.emit("step", {
      id: "bundle",
      status: "error",
      message: "No files to bundle",
    });
    stream.push(null);
    return stream;
  }

  stream.emit("step", { id: "bundle", status: "start" });

  (async () => {
    try {
      // Process extensions before building
      await processExtensions(config, stream);

      await build({
        format: config.format || ["cjs"],
        outDir: config.dist || "dist",
        silent: config.log !== "debug",
        clean: config.clean ?? true,
        entry: config.files,
        minify: config.minify ?? false,
        dts: false,
        splitting: false,
        keepNames: true,
        treeshake: config.production ?? false,
      });
      stream.emit("step", { id: "bundle", status: "done" });

      // Call post-build hooks from extensions
      await callPostBuildHooks(config);

    } catch (error) {
      stream.emit("step", {
        id: "bundle",
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Erreur inconnue lors du build",
      });
    }

    if (
      config.obfuscation ||
      (typeof config.obfuscation === "object" && config.production)
    ) {
      stream.emit("step", { id: "obfuscation", status: "start" });
      const index = fs.readFileSync(
        `${config.dist || "dist"}/index.js`,
        "utf-8",
      );
      const obfuscated = obfuscate(index, {
        target: "node",
        compact: true,
        controlFlowFlattening: true,
        stringArray: true,
        stringArrayThreshold: 1,
        stringArrayEncoding: ["rc4"],
        simplify: true,
      });
      fs.writeFileSync(
        `${config.dist || "dist"}/index.js`,
        obfuscated.getObfuscatedCode(),
      );
      if (config.log === "extend") {
        stream.emit("step", {
          id: "obfuscation",
          status: "progress",
          message: `${config.dist || "dist"}/index.js`,
        });
      }
      stream.emit("step", { id: "obfuscation", status: "done" });
    }

    if (config.artefact) {
      for (const art of config.artefact) {
        stream.emit("step", { id: "artefact", status: "start" });
        if (!fs.existsSync(art)) continue;
        fs.copyFileSync(
          art,
          `${config.dist || "dist"}/${art.replaceAll("src/", "")}`,
        );
        if (config.log === "extend") {
          stream.emit("step", {
            id: "artefact",
            status: "progress",
            message: `index.${art}`,
          });
        }
        stream.emit("step", { id: "artefact", status: "done" });
      }
    }

    stream.emit("end");
    stream.push(null);
  })();

  return stream;
}

export default bundleBot;
