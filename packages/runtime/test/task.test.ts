import { describe, expect, test } from "bun:test";
import type { Client } from "discord.js";
import Task from "../Task";

describe("Task Class", () => {
	test("should initialize with undefined values", () => {
		const task = new Task();
		expect(task.getCron()).toBeUndefined();
		expect(task.getRun()).toBeUndefined();
	});

	test("cron() should set the cron expression and return this", () => {
		const task = new Task();
		const cronExpr = "* * * * *";
		const result = task.cron(cronExpr);

		expect(result).toBe(task);
		expect(task.getCron()).toBe(cronExpr);
	});

	test("run() should set the run function and return this", () => {
		const task = new Task();
		const runFn = (client: Client) => {
			console.log("running task");
		};
		const result = task.run(runFn);

		expect(result).toBe(task);
		expect(task.getRun()).toBe(runFn);
	});

	test("should handle async run function", async () => {
		const task = new Task();
		const runFn = async (client: Client) => {
			await Promise.resolve();
		};
		task.run(runFn);
		expect(task.getRun()).toBe(runFn);
	});

	test("chaining cron() and run()", () => {
		const task = new Task();
		const cronExpr = "0 0 * * *";
		const runFn = (client: Client) => {};

		task.cron(cronExpr).run(runFn);

		expect(task.getCron()).toBe(cronExpr);
		expect(task.getRun()).toBe(runFn);
	});

	test("should overwrite previous values", () => {
		const task = new Task();
		task.cron("1 * * * *").run(() => {});

		const newCron = "2 * * * *";
		const newRun = () => { console.log("new"); };

		task.cron(newCron).run(newRun);

		expect(task.getCron()).toBe(newCron);
		expect(task.getRun()).toBe(newRun);
	});
});
