import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Client } from "discord.js";
import SelectMenuHandler from "../handler/SelectMenuHandler";
import { InteractionHelper } from "../interaction/BaseInteraction";
import ChannelSelectMenu from "../interaction/ChannelSelectMenu";
import RoleSelectMenu from "../interaction/RoleSelectMenu";
import StringSelectMenu from "../interaction/StringSelectMenu";
import UserSelectMenu from "../interaction/UserSelectMenu";

describe("SelectMenuHandler", () => {
	let handler: SelectMenuHandler;

	beforeEach(() => {
		process.env.NODE_ENV = "test";
		const client = new Client({ intents: [] });
		handler = new SelectMenuHandler(client);
	});

	test("should route StringSelectMenu without data", async () => {
		const executed = mock(() => {});
		const menu = new StringSelectMenu().setCustomId("str-menu").run(executed);
		handler.add(menu);

		await handler.onSelectMenuInteraction({
			customId: "str-menu",
			isStringSelectMenu: () => true,
			isUserSelectMenu: () => false,
			isRoleSelectMenu: () => false,
			isChannelSelectMenu: () => false,
			isMentionableSelectMenu: () => false,
		} as any);
		expect(executed).toHaveBeenCalled();
	});

	test("should route StringSelectMenu with data", async () => {
		const executed = mock((_, data) => {
			expect(data).toEqual({ page: 3 });
		});
		const menu = new StringSelectMenu<{ page: number }>()
			.setCustomId("paged-menu")
			.run(executed);
		handler.add(menu);

		const token = InteractionHelper.storeData({ page: 3 });
		await handler.onSelectMenuInteraction({
			customId: `paged-menu:${token}`,
			isStringSelectMenu: () => true,
			isUserSelectMenu: () => false,
			isRoleSelectMenu: () => false,
			isChannelSelectMenu: () => false,
			isMentionableSelectMenu: () => false,
		} as any);
		expect(executed).toHaveBeenCalled();
	});

	test("should reply with expiry message for invalid token", async () => {
		const menu = new StringSelectMenu().setCustomId("exp-menu").run(() => {});
		handler.add(menu);

		const reply = mock(() => {});
		await handler.onSelectMenuInteraction({
			customId: "exp-menu:badtoken",
			isStringSelectMenu: () => true,
			isUserSelectMenu: () => false,
			isRoleSelectMenu: () => false,
			isChannelSelectMenu: () => false,
			isMentionableSelectMenu: () => false,
			reply,
		} as any);
		expect(reply).toHaveBeenCalled();
	});

	test("should route UserSelectMenu", async () => {
		const executed = mock(() => {});
		const menu = new UserSelectMenu().setCustomId("user-menu").run(executed);
		handler.add(menu);

		await handler.onSelectMenuInteraction({
			customId: "user-menu",
			isStringSelectMenu: () => false,
			isUserSelectMenu: () => true,
			isRoleSelectMenu: () => false,
			isChannelSelectMenu: () => false,
			isMentionableSelectMenu: () => false,
		} as any);
		expect(executed).toHaveBeenCalled();
	});

	test("should route RoleSelectMenu", async () => {
		const executed = mock(() => {});
		const menu = new RoleSelectMenu().setCustomId("role-menu").run(executed);
		handler.add(menu);

		await handler.onSelectMenuInteraction({
			customId: "role-menu",
			isStringSelectMenu: () => false,
			isUserSelectMenu: () => false,
			isRoleSelectMenu: () => true,
			isChannelSelectMenu: () => false,
			isMentionableSelectMenu: () => false,
		} as any);
		expect(executed).toHaveBeenCalled();
	});

	test("should route ChannelSelectMenu", async () => {
		const executed = mock(() => {});
		const menu = new ChannelSelectMenu().setCustomId("chan-menu").run(executed);
		handler.add(menu);

		await handler.onSelectMenuInteraction({
			customId: "chan-menu",
			isStringSelectMenu: () => false,
			isUserSelectMenu: () => false,
			isRoleSelectMenu: () => false,
			isChannelSelectMenu: () => true,
			isMentionableSelectMenu: () => false,
		} as any);
		expect(executed).toHaveBeenCalled();
	});

	test("should ignore unknown menu", async () => {
		await handler.onSelectMenuInteraction({
			customId: "ghost",
			isStringSelectMenu: () => true,
			isUserSelectMenu: () => false,
			isRoleSelectMenu: () => false,
			isChannelSelectMenu: () => false,
			isMentionableSelectMenu: () => false,
		} as any);
		// No crash = pass
	});

	test("set() and delete() work correctly", async () => {
		const executed = mock(() => {});
		const a = new StringSelectMenu().setCustomId("a").run(executed);
		const b = new StringSelectMenu().setCustomId("b").run(() => {});
		handler.set([a, b]);
		handler.delete("b");

		await handler.onSelectMenuInteraction({
			customId: "a",
			isStringSelectMenu: () => true,
			isUserSelectMenu: () => false,
			isRoleSelectMenu: () => false,
			isChannelSelectMenu: () => false,
			isMentionableSelectMenu: () => false,
		} as any);
		expect(executed).toHaveBeenCalled();
	});
});
