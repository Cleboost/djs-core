import {
	type Button,
	ButtonHandler,
	type Modal,
	ModalHandler,
	SelectMenuHandler,
	type StringSelectMenu,
} from "@djs-core/runtime";
import { Client } from "discord.js";
import {
	createMockButtonInteraction,
	createMockModalSubmitInteraction,
	createMockSelectMenuInteraction,
	toTestResult,
} from "./mock-interactions";
import type { TestInteractionOptions, TestResult } from "./types";

type ComponentWithCustomId = {
	baseCustomId: string;
	execute(interaction: unknown, data?: unknown): Promise<void>;
};

async function testCustomIdComponent(
	component: ComponentWithCustomId,
	opts: TestInteractionOptions,
	createInteraction: typeof createMockButtonInteraction,
	runHandler: (
		handler: ButtonHandler | ModalHandler | SelectMenuHandler,
		interaction: ReturnType<typeof createMockButtonInteraction>,
	) => Promise<void>,
	createHandler: () => ButtonHandler | ModalHandler | SelectMenuHandler,
	register: (handler: ButtonHandler | ModalHandler | SelectMenuHandler) => void,
): Promise<TestResult> {
	const tokenizeData = opts.viaHandler && opts.data !== undefined;
	const interaction = createInteraction({
		...opts,
		customId: opts.customId ?? component.baseCustomId,
		tokenizeData,
	});
	let error: unknown;

	try {
		if (opts.viaHandler) {
			const handler = createHandler();
			register(handler);
			await runHandler(handler, interaction);
		} else if (opts.data !== undefined) {
			await component.execute(interaction as never, opts.data);
		} else {
			await component.execute(interaction as never);
		}
	} catch (err) {
		error = err;
	}

	return toTestResult(interaction, error);
}

export async function testButton(
	button: Button,
	opts: TestInteractionOptions = {},
): Promise<TestResult> {
	return testCustomIdComponent(
		button as unknown as ComponentWithCustomId,
		opts,
		createMockButtonInteraction,
		(handler, interaction) =>
			(handler as ButtonHandler).onButtonInteraction(interaction as never),
		() => new ButtonHandler(new Client({ intents: [] })),
		(handler) => (handler as ButtonHandler).add(button),
	);
}

export async function testModal(
	modal: Modal,
	opts: TestInteractionOptions = {},
): Promise<TestResult> {
	return testCustomIdComponent(
		modal as unknown as ComponentWithCustomId,
		opts,
		createMockModalSubmitInteraction,
		(handler, interaction) =>
			(handler as ModalHandler).onModalSubmit(interaction as never),
		() => new ModalHandler(new Client({ intents: [] })),
		(handler) => (handler as ModalHandler).add(modal),
	);
}

export async function testSelectMenu(
	menu: StringSelectMenu,
	opts: TestInteractionOptions = {},
): Promise<TestResult> {
	return testCustomIdComponent(
		menu as unknown as ComponentWithCustomId,
		opts,
		createMockSelectMenuInteraction,
		(handler, interaction) =>
			(handler as SelectMenuHandler).onSelectMenuInteraction(
				interaction as never,
			),
		() => new SelectMenuHandler(new Client({ intents: [] })),
		(handler) => (handler as SelectMenuHandler).add(menu),
	);
}
