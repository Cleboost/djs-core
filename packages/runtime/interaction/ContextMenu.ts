import {
	type ApplicationCommandType,
	ContextMenuCommandBuilder,
	type ContextMenuCommandType,
	type MessageContextMenuCommandInteraction,
	type UserContextMenuCommandInteraction,
} from "discord.js";

export type ContextMenuRunFn<
	T extends
		| UserContextMenuCommandInteraction
		| MessageContextMenuCommandInteraction,
> = (interaction: T) => unknown;

export default class ContextMenu<
	TInteraction extends
		| UserContextMenuCommandInteraction
		| MessageContextMenuCommandInteraction =
		| UserContextMenuCommandInteraction
		| MessageContextMenuCommandInteraction,
> extends ContextMenuCommandBuilder {
	private _run?: ContextMenuRunFn<TInteraction>;

	withType(
		type: ApplicationCommandType.User,
	): ContextMenu<UserContextMenuCommandInteraction>;
	withType(
		type: ApplicationCommandType.Message,
	): ContextMenu<MessageContextMenuCommandInteraction>;
	withType(
		type: ContextMenuCommandType,
	):
		| ContextMenu<UserContextMenuCommandInteraction>
		| ContextMenu<MessageContextMenuCommandInteraction> {
		return this.cloneWithType(type) as
			| ContextMenu<UserContextMenuCommandInteraction>
			| ContextMenu<MessageContextMenuCommandInteraction>;
	}

	private cloneWithType(type: ContextMenuCommandType): ContextMenu {
		const newMenu = new ContextMenu();
		newMenu.setType(type);
		if (this.name) newMenu.setName(this.name);
		if (this.defaultMemberPermissions) {
			newMenu.setDefaultMemberPermissions(this.defaultMemberPermissions);
		}
		// biome-ignore lint/suspicious/noExplicitAny: type narrowed by overloads
		if (this._run) newMenu._run = this._run as any;
		return newMenu;
	}

	run(fn: ContextMenuRunFn<TInteraction>): this {
		this._run = fn;
		return this;
	}

	async execute(
		interaction:
			| UserContextMenuCommandInteraction
			| MessageContextMenuCommandInteraction,
	): Promise<void> {
		if (!this._run) {
			throw new Error(
				`The context menu '${this.name}' has no .run() callback defined`,
			);
		}
		await this._run(interaction as TInteraction);
	}
}
