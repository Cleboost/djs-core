import type { SourceFile } from "ts-morph";
import { Node } from "ts-morph";
import type { Diagnostic, Rule } from "./types";

const DEFAULT_DESCRIPTION = "TODO: add a description";

function chainHasSetDescription(node: import("ts-morph").Node): boolean {
	let current = node.getParent();
	while (current) {
		if (
			Node.isPropertyAccessExpression(current) &&
			current.getName() === "setDescription"
		) {
			return true;
		}
		if (Node.isCallExpression(current) || Node.isPropertyAccessExpression(current)) {
			current = current.getParent();
		} else {
			break;
		}
	}
	return false;
}

function isCommandNew(node: import("ts-morph").Node): node is import("ts-morph").NewExpression {
	if (!Node.isNewExpression(node)) return false;
	const expr = node.getExpression();
	return Node.isIdentifier(expr) && expr.getText() === "Command";
}

export const requireDescription: Rule = {
	name: "require-description",
	description:
		"Ensure every Command has a .setDescription() call — missing descriptions show as empty in Discord",

	check(sourceFile: SourceFile): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		sourceFile.forEachDescendant((node) => {
			if (!isCommandNew(node)) return;
			if (chainHasSetDescription(node)) return;

			const pos = sourceFile.getLineAndColumnAtPos(node.getStart());
			diagnostics.push({
				file: sourceFile.getFilePath(),
				line: pos.line,
				column: pos.column,
				message:
					"Command is missing .setDescription() — Discord requires a description for slash commands",
				fixable: true,
				severity: "warn",
			});
		});

		return diagnostics;
	},

	fix(sourceFile: SourceFile): number {
		const nodes = sourceFile
			.getDescendants()
			.filter((n) => isCommandNew(n) && !chainHasSetDescription(n));

		let count = 0;

		for (const node of nodes) {
			if (!Node.isNewExpression(node)) continue;

			const parent = node.getParent();

			if (Node.isPropertyAccessExpression(parent)) {
				// new Command().someMethod(...) — insert setDescription before someMethod
				const grandParent = parent.getParent();
				if (Node.isCallExpression(grandParent)) {
					const method = parent.getName();
					const args = grandParent
						.getArguments()
						.map((a) => a.getText())
						.join(", ");
					grandParent.replaceWithText(
						`new Command().setDescription("${DEFAULT_DESCRIPTION}").${method}(${args})`,
					);
					count++;
				}
			} else {
				// Standalone new Command()
				node.replaceWithText(
					`new Command().setDescription("${DEFAULT_DESCRIPTION}")`,
				);
				count++;
			}
		}

		if (count > 0) sourceFile.saveSync();
		return count;
	},
};
