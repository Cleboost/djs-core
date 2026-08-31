import type { ApplicationCommandOptionChoiceData } from "discord.js";

export interface ReplyCall {
	method: "reply" | "followUp" | "editReply" | "deferReply" | "respond";
	payload: unknown;
}

export interface TestInteractionOptions {
	user?: { id: string; username?: string };
	member?: Record<string, unknown>;
	guild?: { id: string; name?: string };
	channel?: { id: string; type?: number };
	client?: Record<string, unknown>;
	options?: Record<string, unknown>;
	route?: string;
	viaHandler?: boolean;
	data?: unknown;
	values?: string[];
	focused?: { name: string; value: string };
	fields?: Record<string, string>;
	targetUser?: { id: string; username?: string };
	targetMessage?: { id: string; content?: string };
	customId?: string;
	tokenizeData?: boolean;
	args?: unknown[];
}

export interface TestResult {
	interaction: unknown;
	replies: ReplyCall[];
	repliedWith: string | null;
	deferred: boolean;
	error?: unknown;
}

export interface AutocompleteTestResult extends TestResult {
	respondedWith: ApplicationCommandOptionChoiceData[];
}

export interface EventTestResult {
	client: unknown;
	args: unknown[];
	error?: unknown;
}
