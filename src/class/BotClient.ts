/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import { Client, GatewayIntentBits, Partials } from "discord.js";
import CommandHandler from "../handlers/Command";
import Command from "./interactions/Command";
import { Logger } from "./Logger";
import Config from "../types/config";
import ComandMiddleware from "./middlewares/CommandMiddleware";
import ButtonMiddleware from "./middlewares/ButtonMiddleware";
import fs from "node:fs";
import path from "path";
import SubCommandHandler from "../handlers/SubCommand";
import SubCommandGroup from "./interactions/SubCommandGroup";
import { Handler } from "../handlers/Handler";
import { pathToFileURL } from "node:url";
import ModalMiddleware from "./middlewares/ModalMiddleware";
import SelectMiddleware from "./middlewares/SelectMiddleware";

export default class BotClient extends Client {
  logger: Logger = new Logger();
  config: Config | null = null;
  middlewares: Array<
    ComandMiddleware | ButtonMiddleware | ModalMiddleware | SelectMiddleware
  > = [];
  constructor() {
    super({
      intents: [
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
      ],
      partials: [
        Partials.Channel,
        Partials.User,
        Partials.Reaction,
        Partials.Message,
        Partials.GuildMember,
        Partials.GuildScheduledEvent,
        Partials.ThreadMember,
      ],
    });
  }

  async start(token: unknown): Promise<void> {
    if (fs.existsSync(path.join(process.cwd(), "config.js"))) {
      this.config = (
        await import(pathToFileURL(path.join(process.cwd(), "config.js")).href)
      ).default.default;
    }
    if (this.config === null) {
      this.logger.error(
        "Config is not loaded correctly, please check your config file",
      );
      return process.exit(1);
    }
    if (typeof this.config !== "object") {
      this.logger.error("Config must be an object");
      return process.exit(1);
    }

    if (!token) {
      this.logger.error(
        "No token provided, please check your token (bot suhut down)",
      );
      return process.exit(1);
    }

    if (typeof token !== "string") {
      this.logger.error("Token must be a string (bot suhut down)");
      return process.exit(1);
    }

    const handlers: Array<Handler> = [];
    const handlerPromises = [
      Promise.resolve(require("../handlers/Command")),
      Promise.resolve(require("../handlers/SubCommand")),
      Promise.resolve(require("../handlers/Button")),
      Promise.resolve(require("../handlers/SelectMenu")),
      Promise.resolve(require("../handlers/Modal")),
      Promise.resolve(require("../handlers/Event")),
    ];
    const middlewaresPath = path.join(process.cwd(), "middlewares");
    if (fs.existsSync(middlewaresPath)) {
      await fs.promises
        .readdir(middlewaresPath)
        .then(async (files: string[]) => {
          for (const file of files) {
            if (!file.endsWith(".js")) {
              this.logger.warn(`The file ${file} is not a middleware`);
              return;
            }
            const middleware = (
              await import(pathToFileURL(path.join(middlewaresPath, file)).href)
            ).default.default;
            if (
              !(middleware instanceof ComandMiddleware) &&
              !(middleware instanceof ButtonMiddleware) &&
              !(middleware instanceof ModalMiddleware) &&
              !(middleware instanceof SelectMiddleware)
            ) {
              this.logger.error(`The middleware ${file} is not correct!`);
              return;
            }
            this.middlewares.push(middleware);
          }
        })
        .then(() => {
          if (this.middlewares.length === 0) return;
          this.logger.info("All middlewares loaded successfully");
        })
        .catch((error: Error) => {
          this.logger.error(`Error loading middlewares: ${error.message}`);
        });
    }

    await Promise.all(handlerPromises).then((modules) => {
      modules.forEach((handlerModule) => {
        const HandlerClass = handlerModule.default;
        const handlerInstance = new HandlerClass(this);
        handlerInstance.load();
        handlers.push(handlerInstance);
      });
    });

    this.logger.info("All handlers loaded successfully");
    await this.login(token).catch((error) => {
      if ((error as { code?: string }).code === "TokenInvalid") {
        this.logger.error(
          "Invalid token provided, please check your token (bot suhut down)",
        );
      }
      process.exit(1);
    });

    this.once("ready", async () => {
      const commandsList = handlers
        .find((handler) => handler instanceof CommandHandler)
        ?.getCollections()
        .map((command) => (command as Command).getDiscordCommand());
      const subCommandList = (
        (await handlers
          .find((handler) => handler instanceof SubCommandHandler)
          ?.getSubCommandGroupeDiscord()) ?? []
      ).map((subCommand: SubCommandGroup) => subCommand.getDiscordCommand());
      const finalList = (commandsList ?? []).concat(subCommandList ?? []);

      this.application?.commands
        .set(finalList as unknown as Command[])
        .catch((e) => {
          this.logger.error("Error while sending commands to Discord");
          console.log(e);
          console.log(subCommandList);
          process.exit(1);
        });
      this.logger.success("Bot is logged as " + this.user?.username);
    });

    process.on("unhandledRejection", (reason: unknown) => {
      return this.logger.error(`Unhandled Rejection: ${reason}`);
    });

    process.on("uncaughtException", (error: Error) => {
      console.error(error);
      return this.logger.error(`Uncaught Exception: ${error.message}`);
    });
  }
}
