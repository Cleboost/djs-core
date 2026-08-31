import { describe, expect, test } from "bun:test";
import path from "node:path";
import { resolveSafeDest } from "../commands/generate";
import { PATH_ALIASES } from "../utils/common";

describe("resolveSafeDest", () => {
	const root = "/project";
	const commandsDir = path.join(root, PATH_ALIASES.interactions, "commands");

	test("allows nested names within the base directory", () => {
		const dest = resolveSafeDest(commandsDir, "shop/buy");
		expect(dest).toBe(
			path.resolve("/project/src/interactions/commands/shop/buy.ts"),
		);
	});

	test("rejects path traversal outside the base directory", () => {
		expect(() => resolveSafeDest(commandsDir, "../evil")).toThrow(
			"Invalid name",
		);
	});

	test("rejects absolute names", () => {
		expect(() => resolveSafeDest(commandsDir, "/tmp/evil")).toThrow(
			"Invalid name",
		);
	});
});
