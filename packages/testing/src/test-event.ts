import type { EventListener } from "@djs-core/runtime";
import { mockClient } from "./mock-primitives";
import type { EventTestResult, TestInteractionOptions } from "./types";

export async function testEvent(
	listener: EventListener,
	opts: TestInteractionOptions = {},
): Promise<EventTestResult> {
	const client = mockClient(opts.client ?? {});
	const args = opts.args ?? [];
	const fn = listener.getListener();
	let error: unknown;

	try {
		if (!fn) {
			throw new Error("EventListener has no .run() callback defined");
		}
		await fn(client as never, ...(args as []));
	} catch (err) {
		error = err;
	}

	return {
		client,
		args,
		...(error !== undefined ? { error } : {}),
	};
}
