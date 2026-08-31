import { InteractionHelper } from "@djs-core/runtime";
import { createMockOptions } from "./mock-options";
import { applyContextFields, mockUser } from "./mock-primitives";
import { parseRoute } from "./parse-route";
import { attachReplyTracker, type ReplyTrackerState } from "./reply-tracker";
import type { TestInteractionOptions } from "./types";

function baseInteraction(opts: TestInteractionOptions): {
	interaction: Record<string, unknown>;
	state: ReplyTrackerState;
} {
	const interaction: Record<string, unknown> = {};
	const state = attachReplyTracker(interaction);
	applyContextFields(interaction, opts);
	return { interaction, state };
}

function encodeCustomId(
	baseId: string,
	data: unknown | undefined,
	tokenize: boolean,
): string {
	if (data === undefined || !tokenize) return baseId;
	const token = InteractionHelper.storeData(data);
	return `${baseId}:${token}`;
}

function commandNameFromRoute(route?: string): string {
	if (!route) return "command";
	return parseRoute(route).commandName;
}

export function createMockChatInputInteraction(
	opts: TestInteractionOptions = {},
): Record<string, unknown> & { __replyState: ReplyTrackerState } {
	const { interaction, state } = baseInteraction(opts);
	interaction.commandName = commandNameFromRoute(opts.route);
	interaction.options = createMockOptions(opts.options ?? {}, opts.route);
	return Object.assign(interaction, { __replyState: state });
}

export function createMockButtonInteraction(
	opts: TestInteractionOptions & { customId: string },
): Record<string, unknown> & { __replyState: ReplyTrackerState } {
	const { interaction, state } = baseInteraction(opts);
	interaction.customId = encodeCustomId(
		opts.customId,
		opts.data,
		opts.tokenizeData === true,
	);
	return Object.assign(interaction, { __replyState: state });
}

export function createMockModalSubmitInteraction(
	opts: TestInteractionOptions & { customId: string },
): Record<string, unknown> & { __replyState: ReplyTrackerState } {
	const { interaction, state } = baseInteraction(opts);
	interaction.customId = encodeCustomId(
		opts.customId,
		opts.data,
		opts.tokenizeData === true,
	);
	interaction.fields = {
		getTextInputValue: (name: string) => opts.fields?.[name] ?? "",
	};
	return Object.assign(interaction, { __replyState: state });
}

export function createMockSelectMenuInteraction(
	opts: TestInteractionOptions & { customId: string },
): Record<string, unknown> & { __replyState: ReplyTrackerState } {
	const { interaction, state } = baseInteraction(opts);
	interaction.customId = encodeCustomId(
		opts.customId,
		opts.data,
		opts.tokenizeData === true,
	);
	interaction.values = opts.values ?? [];
	return Object.assign(interaction, { __replyState: state });
}

export function createMockAutocompleteInteraction(
	opts: TestInteractionOptions = {},
): Record<string, unknown> & { __replyState: ReplyTrackerState } {
	const { interaction, state } = baseInteraction(opts);
	interaction.commandName = commandNameFromRoute(opts.route);
	const optionValues = { ...(opts.options ?? {}) };
	if (opts.focused) optionValues.__focused = opts.focused;
	interaction.options = createMockOptions(optionValues, opts.route);
	return Object.assign(interaction, { __replyState: state });
}

export function createMockContextMenuInteraction(
	opts: TestInteractionOptions = {},
): Record<string, unknown> & { __replyState: ReplyTrackerState } {
	const { interaction, state } = baseInteraction(opts);
	if (opts.targetUser) {
		interaction.targetUser = mockUser(opts.targetUser);
	}
	if (opts.targetMessage) {
		interaction.targetMessage = {
			id: opts.targetMessage.id,
			content: opts.targetMessage.content ?? "",
		};
	}
	return Object.assign(interaction, { __replyState: state });
}

export function toTestResult(
	interaction: Record<string, unknown> & { __replyState: ReplyTrackerState },
	error?: unknown,
) {
	const state = interaction.__replyState;
	return {
		interaction,
		replies: state.replies,
		repliedWith: state.repliedWith,
		deferred: state.deferred,
		...(error !== undefined ? { error } : {}),
	};
}

export function toAutocompleteResult(
	interaction: Record<string, unknown> & { __replyState: ReplyTrackerState },
	error?: unknown,
) {
	const state = interaction.__replyState;
	const base = toTestResult(interaction, error);
	return { ...base, respondedWith: state.respondedWith };
}
