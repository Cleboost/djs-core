import type { Command } from "@djs-core/runtime";
import {
	createMockAutocompleteInteraction,
	toAutocompleteResult,
} from "./mock-interactions";
import { runCommandHandler } from "./run-command-handler";
import type { AutocompleteTestResult, TestInteractionOptions } from "./types";

export async function testAutocomplete(
	command: Command,
	opts: TestInteractionOptions = {},
): Promise<AutocompleteTestResult> {
	const interaction = createMockAutocompleteInteraction(opts);
	let error: unknown;

	try {
		if (opts.viaHandler) {
			await runCommandHandler(command, opts.route, (handler) =>
				handler.onAutocompleteInteraction(interaction as never),
			);
		} else {
			await command.executeAutocomplete(interaction as never);
		}
	} catch (err) {
		error = err;
	}

	return toAutocompleteResult(interaction, error);
}
