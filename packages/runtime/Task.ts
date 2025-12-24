import type { Client } from "discord.js";

export default class Task {
	private cronExpression?: string;
	private runFn?: (client: Client) => void | Promise<void>;

	public cron(cron: string): this {
		this.cronExpression = cron;
		return this;
	}

	public run(run: (client: Client) => void | Promise<void>): this {
		this.runFn = run;
		return this;
	}

	public getCron(): string | undefined {
		return this.cronExpression;
	}

	public getRun(): ((client: Client) => void | Promise<void>) | undefined {
		return this.runFn;
	}
}
