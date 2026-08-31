import type {
	ApplicationCommandDataResolvable,
	ContextMenuCommandBuilder,
} from "discord.js";
import type { DjsClient } from "../DjsClient";
import type ContextMenu from "../interaction/ContextMenu";
import { compileSlashCommands } from "../utils/compile-command";
import { isUnknownCommandError } from "../utils/discord-errors";
import { runtimeLog } from "../utils/logger";
import type { Route } from "./CommandHandler";

export default class ApplicationCommandHandler {
	private readonly client: DjsClient;
	private commands: Route[] = [];
	private contextMenus: ContextMenu[] = [];
	private guilds: string[] = [];
	private hasWarnedEmptyContext = false;

	constructor(client: DjsClient) {
		this.client = client;
	}

	public setGuilds(guilds: string[]): void {
		this.guilds = guilds;
	}

	public setCommands(commands: Route[]): void {
		this.commands = commands;
	}

	public setContextMenus(contextMenus: ContextMenu[]): void {
		this.contextMenus = contextMenus;
	}

	public async sync(): Promise<void> {
		if (process.env.SKIP_SYNC) return;
		this.assertReady();

		if (!this.client.application) {
			throw new Error("Client application is not available");
		}

		const commandPayload = compileSlashCommands(this.commands, {
			defaultContext: this.client.getDjsConfig()?.commands?.defaultContext,
			onEmptyDefaultContext: () => {
				if (this.hasWarnedEmptyContext) return;
				runtimeLog.warn(
					"config.commands.defaultContext is defined but empty — default context will not be applied",
				);
				this.hasWarnedEmptyContext = true;
			},
		});

		const allCommands: ApplicationCommandDataResolvable[] = [
			...commandPayload,
			...(this.contextMenus as unknown as ContextMenuCommandBuilder[]),
		];

		const application = this.client.application;

		if (this.guilds.length > 0) {
			await Promise.all(
				this.guilds.map(async (guildId) => {
					try {
						await application.commands.set(allCommands, guildId);
					} catch (error: unknown) {
						if (!isUnknownCommandError(error)) throw error;
					}
				}),
			);
		} else {
			try {
				await application.commands.set(allCommands);
			} catch (error: unknown) {
				if (!isUnknownCommandError(error)) throw error;
			}
		}
	}

	private assertReady(): void {
		if (!this.client.isReady()) {
			throw new Error("Client is not ready");
		}
	}
}
