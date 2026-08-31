import type { CAC } from "cac";

export function registerCheckCommand(cli: CAC) {
	cli
		.command("check", "Lint your project for djs-core anti-patterns")
		.option("--fix", "Automatically fix all fixable issues")
		.option("-p, --path <path>", "Custom project path", { default: "." })
		.option("--rule <rule>", "Run only a specific rule")
		.action(async (options: { fix?: boolean; path: string; rule?: string }) => {
			const { runCheck } = await import("./check-run");
			await runCheck(options);
		});
}
