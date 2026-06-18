import path from "node:path";
import type { CAC } from "cac";
import pc from "picocolors";
import { Project } from "ts-morph";
import {
	type Diagnostic,
	noEphemeral,
	noGenericConstructor,
	preferTypedOptions,
	type Rule,
	requireDescription,
} from "../rules/index";

const ALL_RULES: Rule[] = [
	noEphemeral,
	noGenericConstructor,
	preferTypedOptions,
	requireDescription,
];

function formatLocation(d: Diagnostic, root: string): string {
	const rel = path.relative(root, d.file);
	return `${pc.cyan(rel)}${pc.dim(":")}${pc.yellow(String(d.line))}${pc.dim(":")}${pc.yellow(String(d.column))}`;
}

function formatDiagnostic(d: Diagnostic, root: string): string {
	const icon = d.severity === "warn" ? pc.yellow("⚠") : pc.red("✖");
	const fix = d.fixable ? pc.dim("  [fixable]") : "";
	return `  ${formatLocation(d, root)}  ${icon}  ${d.message}${fix}`;
}

export function registerCheckCommand(cli: CAC) {
	cli
		.command("check", "Lint your project for djs-core anti-patterns")
		.option("--fix", "Automatically fix all fixable issues")
		.option("-p, --path <path>", "Custom project path", { default: "." })
		.option("--rule <rule>", "Run only a specific rule")
		.action(async (options: { fix?: boolean; path: string; rule?: string }) => {
			const root = path.resolve(process.cwd(), options.path);
			const srcDir = path.join(root, "src");

			const rules = options.rule
				? ALL_RULES.filter((r) => r.name === options.rule)
				: ALL_RULES;

			if (options.rule && rules.length === 0) {
				console.error(pc.red(`Unknown rule: ${options.rule}`));
				console.error(
					pc.dim(`Available: ${ALL_RULES.map((r) => r.name).join(", ")}`),
				);
				process.exit(1);
			}

			const project = new Project({ skipAddingFilesFromTsConfig: true });
			project.addSourceFilesAtPaths(`${srcDir}/**/*.ts`);

			const sourceFiles = project.getSourceFiles();

			if (sourceFiles.length === 0) {
				console.log(pc.yellow("\n  No TypeScript files found in src/\n"));
				return;
			}

			const allDiagnostics: Diagnostic[] = [];

			for (const sourceFile of sourceFiles) {
				for (const rule of rules) {
					allDiagnostics.push(...rule.check(sourceFile));
				}
			}

			if (allDiagnostics.length === 0) {
				console.log(`\n  ${pc.green("✓")}  No issues found\n`);
				return;
			}

			if (options.fix) {
				let totalFixed = 0;
				for (const sourceFile of sourceFiles) {
					for (const rule of rules) {
						totalFixed += rule.fix(sourceFile);
					}
				}
				const remaining = allDiagnostics.filter((d) => !d.fixable);
				console.log(
					`\n  ${pc.green("✓")}  Fixed ${pc.bold(String(totalFixed))} issue${totalFixed > 1 ? "s" : ""}` +
						(remaining.length > 0
							? pc.dim(
									`  (${remaining.length} warning${remaining.length > 1 ? "s" : ""} remain)`,
								)
							: "") +
						"\n",
				);
				return;
			}

			// Report issues
			console.log(`\n  ${pc.bold("djs-core check")}  ${pc.dim(root)}\n`);

			const byFile = new Map<string, Diagnostic[]>();
			for (const d of allDiagnostics) {
				if (!byFile.has(d.file)) byFile.set(d.file, []);
				byFile.get(d.file)?.push(d);
			}

			for (const [, diagnostics] of byFile) {
				for (const d of diagnostics) {
					console.log(formatDiagnostic(d, root));
				}
			}

			const errors = allDiagnostics.filter((d) => d.severity === "error");
			const warnings = allDiagnostics.filter((d) => d.severity === "warn");
			const fixable = allDiagnostics.filter((d) => d.fixable).length;

			const parts: string[] = [];
			if (errors.length > 0)
				parts.push(
					pc.red(`${errors.length} error${errors.length > 1 ? "s" : ""}`),
				);
			if (warnings.length > 0)
				parts.push(
					pc.yellow(
						`${warnings.length} warning${warnings.length > 1 ? "s" : ""}`,
					),
				);

			console.log(
				`\n  ${parts.join(pc.dim("  "))}` +
					(fixable > 0 ? pc.dim(`  (${fixable} fixable with --fix)`) : "") +
					"\n",
			);

			// Only exit(1) on errors, warnings are informational
			if (errors.length > 0) process.exit(1);
		});
}
