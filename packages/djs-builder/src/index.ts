/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { build } from "tsup";
import { Config } from "./config";
import { Readable } from "stream";
// import { obfuscate } from "javascript-obfuscator";
// import { globSync } from "glob";
import fs from "fs";
// import path from "path";
import { BundlerReadable } from "./readable";
import { obfuscate } from "javascript-obfuscator";

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
      await build({
        format: config.format || ["cjs"],
        outDir: config.dist || "dist",
        silent: config.log !== "debug",
        clean: config.clean ?? true,
        entry: config.files,
        minify: config.minify ?? false,
        dts: false,
        bundle: true,
        splitting: false,
        keepNames: true,
      });
      stream.emit("step", { id: "bundle", status: "done" });
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

    if (config.obfuscation || typeof config.obfuscation === "object" && config.production) {
      stream.emit("step", { id: "obfuscation", status: "start" });
      // for (const file of globSync(`${config.dist || "dist"}/**/*.js`)) {
      //   const code = fs.readFileSync(file, "utf-8");
      //   const obfuscated = obfuscate(code, {
      //     target: "node",
      //     compact: true,
      //     controlFlowFlattening: true,
      //     stringArray: true,
      //     stringArrayThreshold: 1,
      //     stringArrayEncoding: ["rc4"],
      //     simplify: true,
      //   });
      //   fs.writeFileSync(file, obfuscated.getObfuscatedCode());
      //   if (config.log === "extend") {
      //     stream.emit("step", {
      //       id: "obfuscation",
      //       status: "progress",
      //       message: file,
      //     });
      //   }
      // }
      const index = fs.readFileSync(`${config.dist || "dist"}/index.js`, "utf-8");
      const obfuscated = obfuscate(index, {
        target: "node",
            compact: true,
            controlFlowFlattening: true,
            stringArray: true,
            stringArrayThreshold: 1,
            stringArrayEncoding: ["rc4"],
            simplify: true,
      })
      fs.writeFileSync(`${config.dist || "dist"}/index.js`, obfuscated.getObfuscatedCode());
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

    // if (config.production) {
    //   stream.emit("step", { id: "production", status: "start" });
    //   const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    //   delete packageJson.devDependencies;
    //   delete packageJson.scripts;
    //   packageJson.main = "index.js";
    //   packageJson.scripts = {
    //     start: "node index.js",
    //   };
    //   fs.writeFileSync(
    //     path.join(config.dist || "dist", "package.json"),
    //     JSON.stringify(packageJson, null, 2),
    //   );
    //   if (config.log === "extend") {
    //     stream.emit("step", {
    //       id: "production",
    //       status: "progress",
    //       message: "package.json",
    //     });
    //   }
    //   stream.emit("step", { id: "production", status: "done" });
    // }

    stream.emit("end");
    stream.push(null);
  })();

  return stream;
}

export default bundleBot;
