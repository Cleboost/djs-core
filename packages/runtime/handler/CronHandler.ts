import { CronJob } from "cron";
import type { Client } from "discord.js";
import type Task from "../Task";

export default class CronHandler {
	private readonly client: Client;
	private tasks: Map<string, Task> = new Map();
	private jobs: Map<string, CronJob> = new Map();

	constructor(client: Client) {
		this.client = client;
	}

	public add(id: string, task: Task): void {
		if (this.tasks.has(id)) {
			throw new Error(
				`A task with id '${id}' already exists. Use remove() first or choose a different id.`,
			);
		}

		const cron = task.getCron();
		const runFn = task.getRun();

		if (!cron || !runFn) {
			throw new Error(
				`Task '${id}' must have both cron expression and run function defined.`,
			);
		}

		this.tasks.set(id, task);

		try {
			const job = new CronJob(
				cron, // cronTime
				async () => {
					try {
						await runFn(this.client);
					} catch (error) {
						console.error(`Error executing cron task '${id}':`, error);
					}
				}, // onTick
				null, // onComplete
				true, // start
			);

			this.jobs.set(id, job);
		} catch (error) {
			this.tasks.delete(id);
			throw new Error(
				`Invalid cron expression '${cron}' for task '${id}': ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	public remove(id: string): boolean {
		const job = this.jobs.get(id);
		if (job) {
			job.stop();
			this.jobs.delete(id);
			this.tasks.delete(id);
			return true;
		}
		return false;
	}

	public set(tasks: Map<string, Task>): void {
		for (const [_id, job] of this.jobs.entries()) {
			job.stop();
		}
		this.tasks.clear();
		this.jobs.clear();

		for (const [id, task] of tasks.entries()) {
			this.add(id, task);
		}
	}

	public clear(): void {
		for (const [_id, job] of this.jobs.entries()) {
			job.stop();
		}
		this.tasks.clear();
		this.jobs.clear();
	}
}
