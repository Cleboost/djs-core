/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import path from "node:path";
import BotClient from "../class/BotClient";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import Command from "../class/interactions/Command";
import SubCommandGroup from "../class/interactions/SubCommandGroup";
import SubCommand from "../class/interactions/SubCommand";
import Modal from "../class/interactions/Modal";
import Button from "../class/interactions/Button";
import SelectMenu from "../class/interactions/SelectMenu";
import EventListner from "../class/interactions/Event";
import ContextMenu from "../class/interactions/ContextMenu";

export async function loadHandlers(client: BotClient) {
  if (client.devMode) {
    const interactionsPath = path.join(client.cwdPath);
    if (!fs.existsSync(interactionsPath)) {
      return console.log("No interactions found.");
    }

    const interactionsFilePath = recursiveDir(interactionsPath);

    for (const filePath of interactionsFilePath) {
      if (!filePath.endsWith(".js")) continue;
      const interaction = await import(pathToFileURL(filePath).href)
        .then((m) => m.default.default)
        .catch((err) =>
          console.error(`Error loading interaction ${filePath}:`, err),
        );

      if (!interaction) continue;
      registerInteraction(client, interaction);
    }
    return client.logger.info("All handlers loaded successfully");
  }

  const indexPath = path.join(client.cwdPath, "index.js");
  if (!fs.existsSync(indexPath))
    return console.error("index.js not found in production.");
  const index = await import(pathToFileURL(indexPath).href).then(
    (m) => m.default,
  );
  Object.values(index).forEach((exp) => {
    registerInteraction(client, exp);
  });
  return client.logger.info("All handlers loaded successfully");
}

function registerInteraction(
  client: BotClient,
  interaction:
    | Command
    | SubCommandGroup
    | SubCommand
    | Modal
    | Button
    | SelectMenu
    | ContextMenu
    | unknown,
) {
  if (interaction instanceof Command) {
    return client.handlers.commands.addInteraction(interaction);
  } else if (interaction instanceof SubCommandGroup) {
    return client.handlers.subCommands.addSubCommandGroup(interaction);
  } else if (interaction instanceof SubCommand) {
    return client.handlers.subCommands.addSubCommand(interaction);
  } else if (interaction instanceof Modal) {
    return client.handlers.modals.addInteraction(interaction);
  } else if (interaction instanceof Button) {
    return client.handlers.buttons.addInteraction(interaction);
  } else if (interaction instanceof SelectMenu) {
    return client.handlers.selectMenus.addInteraction(interaction);
  } else if (interaction instanceof EventListner) {
    return client.handlers.events.addEvent(interaction);
  } else if (interaction instanceof ContextMenu) {
    return client.handlers.contextMenu.addInteraction(interaction);
  }
  return;
}

export function pushToApi(client: BotClient) {
  const commandList: Array<Command | SubCommandGroup | ContextMenu> = [
    client.handlers.commands.listCommands(),
    client.handlers.subCommands.listSubCommands(),
    client.handlers.contextMenu.listCommands(),
  ].flat();
  client.application?.commands.set(commandList).catch(console.error);
}

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
