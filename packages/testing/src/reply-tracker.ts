import type { ApplicationCommandOptionChoiceData } from "discord.js";
import { extractContent } from "./extract-content";
import type { ReplyCall } from "./types";

export interface ReplyTrackerState {
	replies: ReplyCall[];
	repliedWith: string | null;
	deferred: boolean;
	respondedWith: ApplicationCommandOptionChoiceData[];
}

export function createReplyTracker(): ReplyTrackerState {
	return {
		replies: [],
		repliedWith: null,
		deferred: false,
		respondedWith: [],
	};
}

export function attachReplyTracker(
	interaction: Record<string, unknown>,
	state: ReplyTrackerState = createReplyTracker(),
): ReplyTrackerState {
	interaction.isRepliable = () => true;
	interaction.replied = false;
	interaction.deferred = false;

	const track = (method: ReplyCall["method"], payload: unknown) => {
		state.replies.push({ method, payload });
		const content = extractContent(payload);
		if (content != null) state.repliedWith = content;
	};

	interaction.reply = async (payload: unknown) => {
		track("reply", payload);
		interaction.replied = true;
		return {};
	};

	interaction.followUp = async (payload: unknown) => {
		track("followUp", payload);
		return {};
	};

	interaction.editReply = async (payload: unknown) => {
		track("editReply", payload);
		return {};
	};

	interaction.deferReply = async (payload?: unknown) => {
		state.replies.push({ method: "deferReply", payload: payload ?? null });
		interaction.deferred = true;
		state.deferred = true;
		return {};
	};

	interaction.respond = async (
		choices: ApplicationCommandOptionChoiceData[],
	) => {
		state.replies.push({ method: "respond", payload: choices });
		state.respondedWith = choices;
		return {};
	};

	return state;
}
