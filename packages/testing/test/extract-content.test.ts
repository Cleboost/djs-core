import { describe, expect, test } from "bun:test";
import { extractContent } from "../index";

describe("extractContent", () => {
	test("extracts string payload", () => {
		expect(extractContent("hello")).toBe("hello");
	});

	test("extracts content field", () => {
		expect(extractContent({ content: "world" })).toBe("world");
	});
});
