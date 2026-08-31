import type { Command } from "@djs-core/runtime";
import {
	createMockChatInputInteraction,
	toTestResult,
} from "./mock-interactions";
import { runCommandHandler } from "./run-command-handler";
import type { TestInteractionOptions, TestResult } from "./types";

export async function testCommand(
	command: Command,
	opts: TestInteractionOptions = {},
): Promise<TestResult> {
	const interaction = createMockChatInputInteraction(opts);
	let error: unknown;

	try {
		if (opts.viaHandler) {
			await runCommandHandler(command, opts.route, (handler) =>
				handler.onCommandInteraction(interaction as never),
			);
		} else {
			await command.execute(interaction as never);
		}
	} catch (err) {
		error = err;
	}

	return toTestResult(interaction, error);
}
