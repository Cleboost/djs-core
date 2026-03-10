import { Task } from "@djs-core/runtime";

export default new Task()
	.cron("* * * * *") // every minute
	.run((_client) => {
		console.log("Task executed");
	});
