/**
 * Copyright (c) 2025 Cleboost
 * External contributor can be found on the GitHub
 * Licence: on the GitHub
 */

import { Handler } from "./Handler";
import path from "path";
import fs from "node:fs";
import SubCommandGroup from "../class/interactions/SubCommandGroup";
import { Events, Interaction, MessageFlags, SlashCommandSubcommandBuilder } from "discord.js";
import SubCommand from "../class/interactions/SubCommand";
import { underline } from "kolorist";

export default class SubCommandHandler extends Handler {
	// private middleware: Array<CommandMiddleware> = [];
	private subCommandGroupe: Array<SubCommandGroup> = [];
	async load() {
		// this.middleware = this.client.middlewares.filter((middleware) => middleware instanceof CommandMiddleware) as Array<CommandMiddleware>;

		/* eslint-disable no-async-promise-executor */
		return new Promise<void>(async (resolve) => {
			const commands = path.join(process.cwd(), "interactions", "commands");
			if (!fs.existsSync(commands)) return resolve();
			for (const categories of fs.readdirSync(commands)) {
				for (const command of fs.readdirSync(path.join(commands, categories)).filter((file) => file.endsWith(".js"))) {
					const cmd = require(path.join(commands, categories, command)).default;
					if (!(cmd instanceof SubCommandGroup)) continue;
					if (cmd.options.length === 0) return this.client.logger.error(`SubCommand ${command} has no options`);
					const subCommandPath = path.join(commands, categories, cmd.name);
					if (!fs.existsSync(subCommandPath)) return this.client.logger.warn(`Subcommand folder for ${underline(cmd.name)} not found`);
					const subCommandFiles = fs.readdirSync(subCommandPath);
					for (const option of cmd.options as SlashCommandSubcommandBuilder[]) {
						if (!subCommandFiles.includes(option.name + ".js")) {
							return this.client.logger.warn(`Subcommand ${underline(option.name)} for ${underline(command)} is missing`);
						}
						if (!option.name) return this.client.logger.error(`SubCommand ${option.name} for ${command} has no name`);
						const subCmd = require(path.join(subCommandPath, option.name + ".js")).default
						if (!(subCmd instanceof SubCommand)) return this.client.logger.error(`Subcommand ${underline(option.name)} for ${underline(command)} is not a SubCommand`);
						this.collection.set(`${cmd.name}.${option.name}`, subCmd);
					}
					this.subCommandGroupe.push(cmd);
				}
			}
			resolve();
			this.event();
		});
	}

	async getSubCommandGroupeDiscord() {
		return this.subCommandGroupe;
	}

	async event() {
		this.client.on(Events.InteractionCreate, async (interaction: Interaction) => {
			if (!interaction.isCommand()) return;
			if (interaction.isContextMenuCommand()) return;
			if (!interaction.options.getSubcommand(false)) return;
			const subCommand: SubCommand | unknown = this.collection.get(`${interaction.commandName}.${interaction.options.getSubcommand()}`);
			if (!subCommand || !(subCommand instanceof SubCommand)) return this.client.logger.error(`SubCommand ${interaction.options.getSubcommand()} not found`);

			subCommand.execute(this.client, interaction);

			await new Promise((resolve) => setTimeout(resolve, 2000));
			if (interaction.deferred) return;
			if (interaction.replied) return;

			this.client.logger.warn(`Command (${interaction.commandName}.${interaction.options.getSubcommand()}) took too long to respond, use deferred or reply method within 2 seconds. It could also be an error during execution causing the command to crash and not respond.`);
			return interaction.reply({ content: "Command took too long to respond or an error occurred during execution (please report this to the bot developer)", flags: [MessageFlags.Ephemeral] });
		});
	}
}
