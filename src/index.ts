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
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import chokidar from "chokidar";

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
        execSync("node index.js", {
          stdio: "inherit",
          cwd: path.join(process.cwd(), "dist"),
        });
      } catch {
        // Do nothing
      }
    });

  program
    .command("dev")
    .description("Start the bot in development mode with file watcher")
    .action(async () => {
      const spinner = ora();
      spinner.start(chalk.blue.bold("🚀 Starting development bot..."));
      await build({
        entry: ["src/**/*.ts"],
        outDir: "dist",
        clean: true,
        skipNodeModulesBundle: true,
        format: ["cjs"],
        silent: true,
      });
      if (!fs.existsSync("dist/.env"))
        return console.error(
          "No .env file found! Please create one in the src folder. You can copy the .env.example file.",
        );
      fs.copyFileSync("src/.env", "dist/.env");
      spinner.succeed(chalk.green.bold("Build done!"));

      let bot = spawn("node", ["index.js"], {
        stdio: "inherit",
        cwd: path.join(process.cwd(), "dist"),
      });

      const watcher = chokidar.watch("src", {
        ignored: (path) =>
          path.includes("node_modules") || path.endsWith(".js"),
        cwd: process.cwd(),
        persistent: true,
        ignoreInitial: true,
      });

      watcher.on("ready", () => {
        console.log(chalk.blue.bold("🚀 Watching for file changes...\n\n"));
      });

      watcher.on("change", async (filePath) => {
        bot.kill();
        console.log(
          chalk.green(`File ${filePath} has been changed. Rebuilding...`),
        );

        await build({
          entry: [filePath.replaceAll("\\", "/")],
          outDir: path.join("dist", path.dirname(filePath).replace("src", "")),
          clean: false,
          format: ["cjs"],
          silent: true,
        });

        bot = spawn("node", ["index.js"], {
          stdio: "inherit",
          cwd: path.join(process.cwd(), "dist"),
        });
      });
    });

  program
    .command("build")
    .description("Build the project")
    .option("-o, --obfuscate", "Obfuscate the code")
    .action(async (options) => {
      if (options.obfuscate === true) {
        console.log(chalk.yellow.bold("⚠️ Obfuscation is experimental!"));
        console.log(
          chalk.yellow.bold(
            "⚠️ This can slow down the bot and bundle size is bigger. Use this function only if you know what you are doing!",
          ),
        );
      }
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
            //if file in /commands/* but not in /commmands/**/*.js
            const rex = [
              /^dist[\\/]+interactions[\\/]+commands[\\/]+[a-z]+[\\/]+[a-z]+\.js$/gm,
              /^dist[\\/]+interactions[\\/]+buttons[\\/]+.*\.js$/gm,
              /^dist[\\/]+interactions[\\/]+modals[\\/]+.*\.js$/gm,
              /^dist[\\/]+interactions[\\/]+selects[\\/]+.*\.js$/gm,
            ];

            const code = fs.readFileSync(file, "utf-8");
            const obfuscated = obfuscator.obfuscate(code, {
              target: "node",
              compact: true,
              controlFlowFlattening: true,
              stringArray: true,
              stringArrayThreshold: 1,
              stringArrayEncoding: ["rc4"],
            });

            fs.writeFileSync(file, obfuscated.getObfuscatedCode());

            if (rex.some((r) => r.test(file))) {
              const rdmName = Math.random().toString(36).substring(7);
              const newFile = file.replace(
                path.basename(file),
                `${rdmName}.js`,
              );
              fs.renameSync(file, newFile);
            }
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
