/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import CommandHandler from "../handlers/Command";
import { Logger } from "./Logger";
import Config, { ConfigType } from "./Config";
import ComandMiddleware from "./middlewares/CommandMiddleware";
import ButtonMiddleware from "./middlewares/ButtonMiddleware";
import fs from "node:fs";
import path from "path";
import { pathToFileURL } from "node:url";
import ModalMiddleware from "./middlewares/ModalMiddleware";
import SelectMiddleware from "./middlewares/SelectMiddleware";
import { loadHandlers, pushToApi } from "../handlers/loader";
import { eventListener } from "../handlers/events";
import process from "node:process";
import SubCommandHandler from "../handlers/SubCommand";

interface BotClientArgs {
  dev?: boolean;
  path?: string;
}
type Middlewares =
  | ComandMiddleware
  | ButtonMiddleware
  | ModalMiddleware
  | SelectMiddleware;
export default class BotClient extends Client {
  logger: Logger = new Logger();
  config: ConfigType = {};
  middlewares: Array<Middlewares> = [];
  handlers: {
    commands: CommandHandler;
    subCommands: SubCommandHandler;
  } = {
    commands: new CommandHandler(this),
    subCommands: new SubCommandHandler(this),
  };
  cwdPath: string = process.cwd();
  devMode: boolean = false;
  constructor({ dev, path }: BotClientArgs = {}) {
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
    if (dev) this.devMode = true;
    if (path) this.cwdPath = path;

    console.log(this.cwdPath);
  }

  async start(token: string): Promise<void> {
    if (this.devMode) {
      const configPath = path.join(this.cwdPath, "config.js");
      if (fs.existsSync(configPath)) {
        const configFile: unknown = (
          await import(pathToFileURL(configPath).href)
        ).default.default;
        if (!(configFile instanceof Config)) {
          this.logger.error("Config file is not correct");
          return process.exit(1);
        }
        this.config = configFile.getConfig();
      }
    } else {
      const indexFilePath = path.join(this.cwdPath, "index.js");
      if (!fs.existsSync(indexFilePath)) {
        this.logger.error("Index file not found");
        return process.exit(1);
      }
      const indexFile = (await import(pathToFileURL(indexFilePath).href))
        .default.default;
      const config = Object.values(indexFile).find((exp): exp is Config => {
        if (exp instanceof Config) {
          this.config = exp.getConfig();
          return true;
        }
        return false;
      });

      if (!config || !(config instanceof Config)) {
        this.logger.error("Config file is not correct");
        return process.exit(1);
      }

      if (this.config === null) {
        this.logger.error(
          "Config is not loaded correctly, please check your config file",
        );
        return process.exit(1);
      }
      this.config = config.getConfig();
    }

    if (!token) {
      this.logger.error(
        "No token provided, please check your token (bot suhut down)",
      );
      return process.exit(1);
    }

    // @TODO: Need to be fixed with new no folder structure
    // const middlewaresPath = path.join(process.cwd(), "middlewares");
    // if (fs.existsSync(middlewaresPath)) {
    //   await fs.promises
    //     .readdir(middlewaresPath)
    //     .then(async (files: string[]) => {
    //       for (const file of files) {
    //         if (!file.endsWith(".js")) {
    //           this.logger.warn(`The file ${file} is not a middleware`);
    //           return;
    //         }
    //         const middleware = (
    //           await import(pathToFileURL(path.join(middlewaresPath, file)).href)
    //         ).default.default;
    //         if (
    //           !(middleware instanceof ComandMiddleware) &&
    //           !(middleware instanceof ButtonMiddleware) &&
    //           !(middleware instanceof ModalMiddleware) &&
    //           !(middleware instanceof SelectMiddleware)
    //         ) {
    //           this.logger.error(`The middleware ${file} is not correct!`);
    //           return;
    //         }
    //         this.middlewares.push(middleware);
    //       }
    //     })
    //     .then(() => {
    //       if (this.middlewares.length === 0) return;
    //       this.logger.info("All middlewares loaded successfully");
    //     })
    //     .catch((error: Error) => {
    //       this.logger.error(`Error loading middlewares: ${error.message}`);
    //     });
    // }

    loadHandlers(this);
    await this.login(token).catch((error) => {
      if ((error as { code?: string }).code === "TokenInvalid") {
        this.logger.error(
          "Invalid token provided, please check your token (bot suhut down)",
        );
      }
      process.exit(1);
    });

    this.once(Events.ClientReady, async () => {
      this.logger.success("Bot is logged as " + this.user?.username);
      pushToApi(this);
      eventListener(this);
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
