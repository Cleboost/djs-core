import path from "node:path";
import BotClient from "../class/BotClient";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import Command from "../class/interactions/Command";
import SubCommandGroup from "../class/interactions/SubCommandGroup";

export async function loadHandlers(client: BotClient) {
  if (client.devMode) {
    const interactionsPath = path.join(process.cwd(), "interactions");
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

      if (interaction instanceof Command) {
        client.handlers.commands.addInteraction(interaction);
      }
    }    
    return client.logger.info("All handlers loaded successfully");
  }

  const indexPath = path.join(process.cwd(), "index.js");
  if (!fs.existsSync(indexPath))
    return console.error("index.js not found in production.");
  const index = await import(pathToFileURL(indexPath).href).then(
    (m) => m.default,
  );
  Object.values(index).forEach((exp) => {
    if (exp instanceof Command) {
      client.handlers.commands.addInteraction(exp);
    }
  });
  return client.logger.info("All handlers loaded successfully");
}

export function pushToApi(client: BotClient) {
  const commandList: Array<Command | SubCommandGroup> = [
    client.handlers.commands.listCommands(),
  ].flat();
  client.application?.commands.set(commandList).catch(console.error);
}

// export function loadMiddlewares(client: BotClient) {}

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
