/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import BotClient from "./class/BotClient";
import Command from "./class/interactions/Command";
import Config from "./types/config";
import SubCommand from "./class/interactions/SubCommand";
import SubCommandGroup from "./class/interactions/SubCommandGroup";
import Button from "./class/interactions/Button";
import SelectMenu from "./class/interactions/SelectMenu";
import Modal from "./class/interactions/Modal";
import { program } from "commander";
import { build } from "tsup";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";

export {
  BotClient,
  Command,
  SubCommand,
  SubCommandGroup,
  Button,
  SelectMenu,
  Modal,
};
export type { Config };

if (require.main === module) {
  program
    .version("1.0.0")
    .description("djs-core CLI")
    .usage("<command> [options]");

  program
    .command("init")
    .description("Initialize a new project")
    .action(() => {
      console.log(chalk.yellow.bold("🚧 This feature is coming soon!"));
    });

  program
    .command("start")
    .description("Start the bot (not recommended for production)")
    .action(async () => {
      await build({
        entry: ["src/**/*.ts"],
        outDir: "dist",
        clean: true,
        skipNodeModulesBundle: true,
        format: ["cjs"],
        silent: true,
      });
      fs.copyFileSync("src/.env", "dist/.env");
      try {
        execSync("node dist/index.js", { stdio: "inherit" });
      } catch {
        // Do nothing
      }
    });

  program
  .command("dev")
  .description("Start the bot in development mode")
  .action(async () => {
    await build({
      entry: ["src/**/*.ts"],
      outDir: "dist",
      clean: true,
      skipNodeModulesBundle: true,
      format: ["cjs"],
      silent: true,
      watch: true,
      onSuccess: async () => {
        fs.copyFileSync("src/.env", "dist/.env");
        try {
          execSync("node dist/index.js", { stdio: "inherit" });
        } catch {
          // Do nothing
        }
      }
    });
  });

  program
    .command("build")
    .description("Build the project")
    .option("-o, --obfuscate", "Obfuscate the code")
    .action(async (options) => {
      const spinner = ora();
      console.log(chalk.blue.bold("🚀 Starting build process...\n"));
      await build({
        entry: ["src/**/*.ts"],
        outDir: "dist",
        clean: true,
        minify: true,
        skipNodeModulesBundle: true,
        format: ["cjs"],
        silent: true,
      });

      fs.copyFileSync("src/.env", "dist/.env");
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
      delete pkg.devDependencies;
      pkg.main = "index.js";
      pkg.credit = "Developed and built with djs-core";
      pkg.scripts = {
        start: "node index.js",
      };
      fs.writeFileSync("dist/package.json", JSON.stringify(pkg, null, 2));

      spinner.succeed(chalk.green.bold("✅ Build done!"));
      if (options.obfuscate === true) {
        spinner.start("⚙️ Obfuscating...");
        if (detectPackageManager() === null) {
          console.error(
            chalk.red.bold(
              "❌ No package manager found. Please install pnpm or npm.",
            ),
          );
          process.exit(1);
        }

        if (!fs.existsSync("node_modules/javascript-obfuscator")) {
          execSync(
            `${detectPackageManager()} install javascript-obfuscator --save-dev`,
            {
              stdio: "ignore",
            },
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const obfuscator = require(
          path.join(process.cwd(), "node_modules/javascript-obfuscator"),
        );

        const files = getBuild("dist");

        for (const file of files) {
          if (file.endsWith(".js")) {
            const code = fs.readFileSync(file, "utf-8");
            const obfuscated = obfuscator.obfuscate(code, {
              target: "node",
              compact: true,
              controlFlowFlattening: true,
              stringArray: true,
              stringArrayThreshold: 1,
              // stringArrayIndexesType: "hexadecimal",
              stringArrayEncoding: ["rc4"],
            });

            fs.writeFileSync(file, obfuscated.getObfuscatedCode());
          }
        }

        spinner.succeed(chalk.green.bold(`✅ Obfuscation done!\n`));
      }
      console.log(
        chalk.blue.bold(
          `🎉 You can now run your bot with ${chalk.yellow(
            "node dist/index.js",
          )} or deploy it to a server.\n`,
        ),
      );
      console.log(chalk.blue.bold("🚀 Auto-deploy feature coming soon!"));
      return;
    });

  program.parse(process.argv);
}

function detectPackageManager() {
  const managers = ["pnpm", "npm"];
  for (const manager of managers) {
    try {
      execSync(`${manager} -v`, { stdio: "ignore" });

      return manager;
    } catch {
      continue;
    }
  }
  return null;
}

function getBuild(dir: string): Array<string> {
  const files: Array<string> = [];
  const reader = (dir: string) => {
    fs.readdirSync(dir).forEach((file) => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        reader(filePath);
      } else {
        files.push(filePath);
      }
    });
  };
  reader(dir);
  return files;
}
