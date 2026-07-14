import { describe, expect, mock, test } from "bun:test";
import { PermissionFlagsBits } from "discord.js";
import Command from "../interaction/Command";
import {
	applyDefaultMemberPermissions,
	buildCommandStructure,
	routesToEntries,
} from "../utils/compile-command";

describe("applyDefaultMemberPermissions", () => {
	test("merges leaf permissions onto root builder for nested routes", () => {
		const exportCmd = new Command()
			.setName("export")
			.setDescription("export")
			.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

		const kickCmd = new Command().setName("kick").setDescription("kick");

		const routes = [
			{ route: "admin.logs.export", command: exportCmd },
			{ route: "admin.moderation.kick", command: kickCmd },
		];

		const entries = routesToEntries(routes, "admin");
		const { groups, builder } = buildCommandStructure(
			"admin",
			entries,
			() => "admin cmd",
		);

		for (const [groupName, subs] of groups) {
			builder.addSubcommandGroup((g) => {
				g.setName(groupName).setDescription("No description");
				for (const [subName, cmd] of subs) {
					g.addSubcommand((sc) =>
						sc.setName(subName).setDescription(cmd.description ?? "x"),
					);
				}
				return g;
			});
		}

		applyDefaultMemberPermissions(builder, entries);

		expect(Number(builder.toJSON().default_member_permissions)).toBe(
			Number(PermissionFlagsBits.Administrator),
		);
	});

	test("warns when subcommands have different default_member_permissions", () => {
		const warnSpy = mock(() => {});
		const originalWarn = console.warn;
		console.warn = warnSpy;

		try {
			const exportCmd = new Command()
				.setName("export")
				.setDescription("export")
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

			const kickCmd = new Command()
				.setName("kick")
				.setDescription("kick")
				.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

			const routes = [
				{ route: "admin.logs.export", command: exportCmd },
				{ route: "admin.moderation.kick", command: kickCmd },
			];

			const entries = routesToEntries(routes, "admin");
			const { builder } = buildCommandStructure(
				"admin",
				entries,
				() => "admin cmd",
			);

			applyDefaultMemberPermissions(builder, entries);

			expect(warnSpy).toHaveBeenCalledTimes(1);
			expect(String(warnSpy.mock.calls[0]?.[0])).toContain(
				"subcommands with different default_member_permissions",
			);

			applyDefaultMemberPermissions(builder, entries);
			expect(warnSpy).toHaveBeenCalledTimes(2);
		} finally {
			console.warn = originalWarn;
		}
	});
});
