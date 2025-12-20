import {
	ContextMenuCommandBuilder,
	type MessageContextMenuCommandInteraction,
	type UserContextMenuCommandInteraction,
	ApplicationCommandType,
	type ContextMenuCommandType,
} from "discord.js";

export type ContextMenuRunFn<
	T extends
		| UserContextMenuCommandInteraction
		| MessageContextMenuCommandInteraction,
> = (
	interaction: T,
	// biome-ignore lint/suspicious/noExplicitAny: Allow any return type for flexibility
) => any;

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
		let data: {
			name?: string;
			default_member_permissions?: string | bigint | null;
			dm_permission?: boolean | null;
		} | null = null;
		if (this.name) {
			try {
				data = this.toJSON();
			} catch {
				data = null;
			}
		}

		if (type === ApplicationCommandType.User) {
			const newMenu = new ContextMenu<UserContextMenuCommandInteraction>();
			newMenu.setType(type);
			if (data?.name) newMenu.setName(data.name);
			if (data?.default_member_permissions) {
				newMenu.setDefaultMemberPermissions(data.default_member_permissions);
			}
			if (data?.dm_permission !== undefined) {
				newMenu.setDMPermission(data.dm_permission);
			}
			if (this._run) {
				newMenu._run = this
					._run as ContextMenuRunFn<UserContextMenuCommandInteraction>;
			}
			return newMenu;
		}
		if (type === ApplicationCommandType.Message) {
			const newMenu = new ContextMenu<MessageContextMenuCommandInteraction>();
			newMenu.setType(type);
			if (data?.name) newMenu.setName(data.name);
			if (data?.default_member_permissions) {
				newMenu.setDefaultMemberPermissions(data.default_member_permissions);
			}
			if (data?.dm_permission !== undefined) {
				newMenu.setDMPermission(data.dm_permission);
			}
			if (this._run) {
				newMenu._run = this
					._run as ContextMenuRunFn<MessageContextMenuCommandInteraction>;
			}
			return newMenu;
		}
		const newMenu = new ContextMenu<UserContextMenuCommandInteraction>();
		newMenu.setType(type);
		if (data?.name) newMenu.setName(data.name);
		if (data?.default_member_permissions) {
			newMenu.setDefaultMemberPermissions(data.default_member_permissions);
		}
		if (data?.dm_permission !== undefined) {
			newMenu.setDMPermission(data.dm_permission);
		}
		if (this._run) {
			newMenu._run = this
				._run as ContextMenuRunFn<UserContextMenuCommandInteraction>;
		}
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
