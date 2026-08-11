import { afterEach, describe, expect, mock, test } from "bun:test";
import { createLogger } from "../utils/logger";

describe("logger", () => {
	const originalLog = console.log;
	const originalWarn = console.warn;
	const originalError = console.error;

	afterEach(() => {
		console.log = originalLog;
		console.warn = originalWarn;
		console.error = originalError;
		delete process.env.DJS_LOG_LEVEL;
	});

	test("formats scoped messages with time and level icon", () => {
		const logSpy = mock(() => {});
		console.log = logSpy;

		const log = createLogger("DEV");
		log.info("Config loaded");

		expect(logSpy).toHaveBeenCalledTimes(1);
		const line = String(logSpy.mock.calls[0]?.[0]);
		expect(line).toMatch(/^\d{2}:\d{2} ℹ \[DEV\] Config loaded$/);
	});

	test("warnBlock prints title and indented rows", () => {
		const warnSpy = mock(() => {});
		console.warn = warnSpy;

		const log = createLogger("RUNTIME");
		log.warnBlock({
			title: "Permission mismatch on /admin",
			body: ["Discord only supports one permission set per root command."],
			rows: [
				{ label: "admin.logs.export", value: "Administrator (8)" },
				{ label: "admin.moderation.kick", value: "KickMembers (2)" },
			],
		});

		expect(warnSpy.mock.calls.length).toBeGreaterThanOrEqual(4);
		expect(String(warnSpy.mock.calls[0]?.[0])).toContain(
			"Permission mismatch on /admin",
		);
		expect(String(warnSpy.mock.calls.at(-1)?.[0])).toContain(
			"admin.moderation.kick",
		);
	});

	test("respects DJS_LOG_LEVEL", () => {
		process.env.DJS_LOG_LEVEL = "error";
		const logSpy = mock(() => {});
		console.log = logSpy;

		const log = createLogger("RUNTIME");
		log.info("hidden");
		log.error("visible");

		expect(logSpy).toHaveBeenCalledTimes(0);
	});
});
