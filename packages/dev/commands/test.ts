import { spawnSync } from "node:child_process";
import path from "node:path";
import type { CAC } from "cac";

export function registerTestCommand(cli: CAC) {
	cli
		.command("test [patterns...]", "Run project tests with Bun")
		.option("-p, --path <path>", "Custom project path", { default: "." })
		.action((patterns: string[], options: { path: string }) => {
			const root = path.resolve(process.cwd(), options.path);
			const args = ["test", ...patterns];
			const result = spawnSync("bun", args, {
				cwd: root,
				stdio: "inherit",
			});
			process.exit(result.status ?? 1);
		});
}
