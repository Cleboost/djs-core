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
import ModalHandler from "../handlers/Modal";
import ButtonHandler from "../handlers/Button";
import SelectMenuHandler from "../handlers/SelectMenu";

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
  handlers = {
    commands: new CommandHandler(this),
    subCommands: new SubCommandHandler(this),
    modals: new ModalHandler(this),
    buttons: new ButtonHandler(this),
    selectMenus: new SelectMenuHandler(this),
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
  }

  async start(token: string): Promise<void> {
    if (this.devMode) {
      const configPath = path.join(this.cwdPath, "config.js");
      if (fs.existsSync(configPath)) {
        const configFile: unknown = (
          await import(pathToFileURL(configPath).href)
        ).default.default;
        if (!(configFile instanceof Config)) {
          this.logger.error(new Error("Config file is not correct"));
          return process.exit(1);
        }
        this.config = configFile.getConfig();
      }
    } else {
      const indexFilePath = path.join(this.cwdPath, "index.js");
      if (!fs.existsSync(indexFilePath)) {
        this.logger.error(new Error("Index file not found"));
        return process.exit(1);
      }
      const indexFile = (await import(pathToFileURL(indexFilePath).href))
        .default;
      if (!indexFile) {
        this.logger.error(new Error("Index file is not correct"));
        return process.exit(1);
      }
      const config = Object.values(indexFile).find((exp): exp is Config => {
        if (exp instanceof Config) {
          this.config = exp.getConfig();
          return true;
        }
        return false;
      });

      if (!config || !(config instanceof Config)) {
        this.logger.error(new Error("Config file is not correct"));
        return process.exit(1);
      }

      if (this.config === null) {
        this.logger.error(
          new Error("Config file is not correct, please check your config"),
        );
        return process.exit(1);
      }
      this.config = config.getConfig();
    }

    if (!token) {
      this.logger.error(
        new Error(
          "Token not provided, please check your config (bot suhut down)",
        ),
      );
      return process.exit(1);
    }

    loadHandlers(this);
    await this.login(token).catch((error) => {
      if ((error as { code?: string }).code === "TokenInvalid") {
        this.logger.error(
          new Error(
            "Token is invalid, please check your config (bot suhut down)",
          ),
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
      return this.logger.error(reason as Error);
    });

    process.on("uncaughtException", (error: Error) => {
      console.error(error);
      return this.logger.error(error);
    });
  }
}
