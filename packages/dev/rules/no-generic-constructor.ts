import type { SourceFile } from "ts-morph";
import { Node } from "ts-morph";
import type { Diagnostic, Rule } from "./types";

const COMPONENTS_WITH_DATA = [
	"Button",
	"Modal",
	"StringSelectMenu",
	"UserSelectMenu",
	"RoleSelectMenu",
	"ChannelSelectMenu",
	"MentionableSelectMenu",
];

function isDeprecatedGenericNew(
	node: import("ts-morph").Node,
): node is import("ts-morph").NewExpression {
	if (!Node.isNewExpression(node)) return false;
	const expr = node.getExpression();
	if (!Node.isIdentifier(expr)) return false;
	if (!COMPONENTS_WITH_DATA.includes(expr.getText())) return false;
	return node.getTypeArguments().length > 0;
}

export const noGenericConstructor: Rule = {
	name: "no-generic-constructor",
	description:
		"Deprecated: passing generics directly to constructors (e.g. new Button<T>()) — use .withData<T>() instead",

	check(sourceFile: SourceFile): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		sourceFile.forEachDescendant((node) => {
			if (!isDeprecatedGenericNew(node)) return;

			const expr = (node as import("ts-morph").NewExpression).getExpression();
			const name = Node.isIdentifier(expr) ? expr.getText() : "Component";
			const typeArgs = (node as import("ts-morph").NewExpression)
				.getTypeArguments()
				.map((t) => t.getText())
				.join(", ");

			const pos = sourceFile.getLineAndColumnAtPos(node.getStart());
			diagnostics.push({
				file: sourceFile.getFilePath(),
				line: pos.line,
				column: pos.column,
				message: `[deprecated] new ${name}<${typeArgs}>() — use new ${name}().withData<${typeArgs}>() instead`,
				fixable: true,
				severity: "warn",
			});
		});

		return diagnostics;
	},

	fix(sourceFile: SourceFile): number {
		const nodes = sourceFile
			.getDescendants()
			.filter(isDeprecatedGenericNew)
			.reverse(); // process from end to start to preserve positions

		let count = 0;

		for (const node of nodes) {
			if (!Node.isNewExpression(node)) continue;

			const expr = node.getExpression();
			const name = Node.isIdentifier(expr) ? expr.getText() : "";
			const typeArgs = node
				.getTypeArguments()
				.map((t) => t.getText())
				.join(", ");
			const args = node
				.getArguments()
				.map((a) => a.getText())
				.join(", ");

			node.replaceWithText(`new ${name}(${args}).withData<${typeArgs}>()`);
			count++;
		}

		if (count > 0) sourceFile.saveSync();
		return count;
	},
};
