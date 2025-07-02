#!/usr/bin/env node

/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { program } from "commander";
import chalk from "chalk";
import bundleBot from "@djs-core/builder";
import path from "path";
import ora from "ora";
import chokidar from "chokidar";
import fs from "fs";
import {
  BotClient,
  Command,
  Modal,
  SubCommand,
  Button,
  SelectMenu,
  ContextMenu,
} from "djs-core";
import dotenv from "dotenv";
import { pathToFileURL } from "url";
import { validateInteractions } from "./validator";

if (require.main !== module) {
  console.error(chalk.red("❌ This file should be run as a CLI tool."));
  process.exit(1);
}

program.name("djs-core").version("0.0.1");

program
  .command("init")
  .description("Initialize a new project")
  .action(() => {
    console.log(chalk.yellow("🚧 This command is in development."));
    // console.log(chalk.green("✨ Initializing a new project..."));
  });

program
  .command("start")
  .description("Start the bot")
  .action(async () => {
    // Validate interactions before starting
    console.log(chalk.blue("🔍 Validating interactions..."));
    const validationResult = await validateInteractions(
      path.join(process.cwd(), "src"),
    );

    if (!validationResult.success) {
      console.log(
        chalk.red("❌ Validation failed! Found the following issues:\n"),
      );

      for (const error of validationResult.errors) {
        const icon =
          error.type === "duplicate_id"
            ? "🔄"
            : error.type === "button_format"
              ? "🔘"
              : "⚠️";
        console.log(chalk.red(`${icon} ${error.file}: ${error.message}`));
      }

      console.log(chalk.red("\n💡 Please fix these issues before starting."));
      return process.exit(1);
    }

    console.log(chalk.green("✅ All interactions validated successfully!"));

    const spinner = ora("✨ Starting the bot...").start();
    const bundleEvent = bundleBot({
      files: ["src/**/*.ts"],
      artefact: ["src/.env"],
    }).on("step", (step) => {
      if (step.status === "error") {
        console.log(
          chalk.red(
            "❌ An error occurred while building the bot. Please check the logs above.",
          ),
        );
        return process.exit(1);
      }
    });
    await new Promise((resolve) => bundleEvent.once("end", resolve));
    const devPath = path.join(process.cwd(), ".dev");
    dotenv.config({
      path: path.join(devPath, ".env"),
    });

    const bot: BotClient = new BotClient({ dev: true, path: devPath });
    bot.start(process.env.TOKEN as string);
    spinner.succeed(chalk.green("Bot started successfully."));
    console.log(
      chalk.blue(
        `🚀 The bot is running. You can stop it using ${chalk.yellowBright(
          "Ctrl + C",
        )} or ${chalk.yellowBright("Cmd + C")}.`,
      ),
    );
  });

program
  .command("dev")
  .description("Start the bot in development mode")
  .action(async () => {
    // Validate interactions before starting dev mode
    console.log(chalk.blue("🔍 Validating interactions..."));
    const validationResult = await validateInteractions(
      path.join(process.cwd(), "src"),
    );

    if (!validationResult.success) {
      console.log(
        chalk.yellow("⚠️ Validation found issues that should be fixed:\n"),
      );

      for (const error of validationResult.errors) {
        const icon =
          error.type === "duplicate_id"
            ? "🔄"
            : error.type === "button_format"
              ? "🔘"
              : "⚠️";
        console.log(chalk.yellow(`${icon} ${error.file}: ${error.message}`));
      }

      console.log(
        chalk.yellow(
          "\n💡 Please fix these issues when possible. Continuing with development mode...\n",
        ),
      );
    } else {
      console.log(chalk.green("✅ All interactions validated successfully!"));
    }

    const spinner = ora("✨ Starting the bot in development mode...").start();
    const bundleEvent = bundleBot({
      files: ["src/**/*.ts"],
      artefact: ["src/.env"],
      dist: ".dev",
    }).on("step", (step) => {
      if (step.status === "error") {
        console.log(
          chalk.red(
            "❌ An error occurred while building the bot. Please check the logs above. The bot will not be reloaded until the error is fixed.",
          ),
        );
        console.log(chalk.red("❌ Please fix the error and relaunch cli."));
        return process.exit(1);
      }
    });
    await new Promise((resolve) => bundleEvent.once("end", resolve));
    const devPath = path.join(process.cwd(), ".dev");

    dotenv.config({
      path: path.join(devPath, ".env"),
    });
    const bot: BotClient = new BotClient({ dev: true, path: devPath });

    const watcher = chokidar.watch(path.resolve(process.cwd(), "src"), {
      ignoreInitial: false,
      cwd: process.cwd(),
      ignored: (path) => path.includes("node_modules") || path.endsWith(".js"),
      persistent: true,
    });

    watcher.once("ready", () => {
      bot.start(process.env.TOKEN as string);
      spinner.succeed(chalk.green("Bot started in development mode."));
      console.log(chalk.blue("🔍 Watching for changes..."));
    });

    watcher.on("unlink", async (filePath) => {
      console.log(
        chalk.yellow(
          `🗑️ File ${filePath.replaceAll("\\", "/").replace("src/", "").replace(".ts", ".js")} deleted.`,
        ),
      );
      const rPath = path.join(
        ".dev",
        filePath
          .replaceAll("\\", "/")
          .replace("src/", "")
          .replace(".ts", ".js"),
      );

      if (!fs.existsSync(rPath)) return;
      fs.unlinkSync(rPath);

      const cachedModule =
        require.cache[require.resolve(path.join(process.cwd(), rPath))];
      if (cachedModule) {
        const interaction = cachedModule.exports.default;
        switch (interaction.constructor.name) {
          case "Command":
            bot.handlers.commands.removeInteraction(interaction);
            break;
          default:
            break;
        }
        delete require.cache[require.resolve(path.join(process.cwd(), rPath))];
        return console.log(
          chalk.green(`✅ Successfully removed the interaction from the bot.`),
        );
      }
    });

    watcher.on("change", async (filePath) => {
      console.log(
        chalk.yellow(
          `🔄 File ${filePath.replaceAll("\\", "/").replace("src/", "").replace(".ts", ".js")} changed.`,
        ),
      );
      const buildEvent = bundleBot({
        files: [filePath.replaceAll("\\", "/")],
        dist: path.join(".dev", path.dirname(filePath).replace("src", "")),
        clean: false,
      });

      buildEvent.on("step", (step) => {
        if (step.status === "error") {
          console.log(
            chalk.red(
              "❌ An error occurred while building the bot. Please check the logs above. The bot will not be reloaded until the error is fixed.",
            ),
          );
          buildEvent.removeAllListeners();
          return;
        }
      });

      buildEvent.once("end", async () => {
        const compiledFilePath = path.join(
          process.cwd(),
          ".dev",
          filePath
            .replaceAll("\\", "/")
            .replace("src/", "")
            .replace(".ts", ".js"),
        );

        const fileURL = pathToFileURL(compiledFilePath).href;

        if (require.cache[require.resolve(compiledFilePath)]) {
          delete require.cache[require.resolve(compiledFilePath)];
        }

        const file = (await import(`${fileURL}?update=${Date.now()}`)).default
          .default;

        if (file instanceof Command)
          return bot.handlers.commands.reloadInteraction(file);
        if (file instanceof SubCommand)
          return bot.handlers.subCommands.reloadSubCommand(file);
        if (file instanceof Modal)
          return bot.handlers.modals.reloadInteraction(file);
        if (file instanceof Button)
          return bot.handlers.buttons.reloadInteraction(file);
        if (file instanceof SelectMenu)
          return bot.handlers.selectMenus.reloadInteraction(file);
        if (file instanceof ContextMenu)
          return bot.handlers.contextMenu.reloadInteraction(file);

        console.log(chalk.yellow("⚠️ Unknown file type, skipping hot reload"));
      });
    });
  });

program
  .command("build")
  .description("Build the bot")
  .option("-o, --obfuscate", "Obfuscate the code")
  .action(async (options) => {
    if (options.obfuscate) {
      console.log(
        chalk.yellow(
          "⚠️  Obfuscation is enabled. Note that this is a experimental feature.",
        ),
      );
      console.log(
        chalk.yellow(
          "This may slow down your bot and make the bundle larger.\n\n",
        ),
      );
    }

    // Validate interactions before building
    console.log(chalk.blue("🔍 Validating interactions..."));
    const validationResult = await validateInteractions(
      path.join(process.cwd(), "src"),
    );

    if (!validationResult.success) {
      console.log(
        chalk.red("❌ Validation failed! Found the following issues:\n"),
      );

      for (const error of validationResult.errors) {
        const icon =
          error.type === "duplicate_id"
            ? "🔄"
            : error.type === "button_format"
              ? "🔘"
              : "⚠️";
        console.log(chalk.red(`${icon} ${error.file}: ${error.message}`));
      }

      console.log(chalk.red("\n💡 Please fix these issues before building."));
      return process.exit(1);
    }

    console.log(chalk.green("✅ All interactions validated successfully!"));

    const spinner = ora("✨ Building the bot...").start();

    if (fs.existsSync(path.join(process.cwd(), "index.ts"))) {
      fs.unlinkSync(path.join(process.cwd(), "index.ts"));
    }

    const files = recursiveDir(path.join(process.cwd(), "src")).filter((file) =>
      file.endsWith(".ts"),
    );
    let content = "import {BotClient} from 'djs-core';\n";
    content += "import {config} from 'dotenv';\n";
    content += "config();\n";
    content += "const zzzz = new BotClient();\n";
    content += "zzzz.start(process.env.TOKEN);\n";
    let iCounter = 0;
    for (const file of files) {
      content += `import ${getCharFromIndex(iCounter)} from "${file
        .replace(path.join(process.cwd(), "src"), "./src")
        .replace(/\\/g, "/")}";\n`;
      iCounter++;
    }
    content += "export {\n";
    for (const i of Array(iCounter).keys()) {
      content += `${getCharFromIndex(i)},\n`;
    }
    content += "};\n";
    fs.writeFileSync(path.join(process.cwd(), "index.ts"), content);

    function recursiveDir(dirPath: string): string[] {
      const files = fs.readdirSync(dirPath);
      const dirs: string[] = [];
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          dirs.push(...recursiveDir(filePath));
        } else if (stat.isFile()) {
          dirs.push(filePath);
        }
      }
      return dirs;
    }

    const bundleEvent = bundleBot({
      files: ["index.ts"],
      artefact: ["src/.env"],
      production: true,
      obfuscation: options.obfuscate || false,
      minify: true,
    });
    await new Promise((resolve) => bundleEvent.once("end", resolve));
    fs.unlinkSync(path.join(process.cwd(), "index.ts"));
    spinner.succeed(chalk.green("Build complete."));

    console.log(
      chalk.blue(
        `📦 The bot has been built. You can run the bot using \`${chalk.yellowBright("node index.js")}\` in dist folder`,
      ),
    );
    console.log(
      chalk.blue("🚀 New features for auto-deploy are comming soon!"),
    );
  });

program
  .command("deploy")
  .description("Deploy the bot")
  .action(() => {
    console.log(
      chalk.blue(
        "🚀 Fast deploy options are coming soon for Cloudflare Workers (free), Vercel (free), Debian VPS with PM2, and Pterodactyl (paid, provided by the hosting provider).",
      ),
    );
    console.log(
      chalk.yellow(
        "🚧 Fast deploy options will be available in upcoming versions.",
      ),
    ); // console.log(chalk.green("✨ Deploying the bot..."));
    // console.log(chalk.green("✨ Deploying the bot..."));
  });

program.parse(process.argv);

function getCharFromIndex(index: number) {
  const charCode = 97 + index;
  return String.fromCharCode(charCode);
}
