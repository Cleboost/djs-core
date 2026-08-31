import { type Command, CommandHandler } from "@djs-core/runtime";
import { Client } from "discord.js";

function resolveCommandRoute(
	command: Command,
	route?: string,
	label = "command",
): string {
	const key = route ?? command.name;
	if (!key) {
		throw new Error(
			`test${label} viaHandler requires opts.route or command.setName()`,
		);
	}
	return key;
}

export async function runCommandHandler(
	command: Command,
	route: string | undefined,
	run: (handler: CommandHandler) => Promise<void>,
): Promise<void> {
	const client = new Client({ intents: [] });
	const handler = new CommandHandler(client);
	handler.set([{ route: resolveCommandRoute(command, route), command }]);
	await run(handler);
}
