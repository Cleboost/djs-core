import { describe, expect, test } from "bun:test";
import { getLeaf, getRoot, splitRoute } from "../utils/route";

describe("Route Utilities", () => {
	test("splitRoute should split complex routes", () => {
		expect(splitRoute("admin.moderation.kick")).toEqual([
			"admin",
			"moderation",
			"kick",
		]);
		expect(splitRoute("  ping  ")).toEqual(["ping"]);
		expect(splitRoute("system..info")).toEqual(["system", "info"]);
	});

	test("getRoot should return the first part", () => {
		expect(getRoot("admin.moderation.kick")).toBe("admin");
		expect(getRoot("ping")).toBe("ping");
	});

	test("getRoot should throw on empty route", () => {
		expect(() => getRoot("")).toThrow();
	});

	test("getLeaf should return the last part", () => {
		expect(getLeaf("admin.moderation.kick")).toBe("kick");
		expect(getLeaf("ping")).toBe("ping");
	});
});
