import { type ContextMenu, ContextMenuHandler } from "@djs-core/runtime";
import { Client } from "discord.js";
import {
	createMockContextMenuInteraction,
	toTestResult,
} from "./mock-interactions";
import type { TestInteractionOptions, TestResult } from "./types";

export async function testContextMenu(
	menu: ContextMenu,
	opts: TestInteractionOptions = {},
): Promise<TestResult> {
	const interaction = createMockContextMenuInteraction(opts);
	interaction.commandName = (menu as { name?: string }).name ?? "menu";
	interaction.isUserContextMenuCommand = () => Boolean(opts.targetUser);
	interaction.isMessageContextMenuCommand = () => Boolean(opts.targetMessage);
	let error: unknown;

	try {
		if (opts.viaHandler) {
			const client = new Client({ intents: [] });
			const handler = new ContextMenuHandler(client);
			handler.set([menu]);
			await handler.onContextMenuInteraction(interaction as never);
		} else {
			await menu.execute(interaction as never);
		}
	} catch (err) {
		error = err;
	}

	return toTestResult(interaction, error);
}
