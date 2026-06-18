import type { SourceFile } from "ts-morph";
import { Node } from "ts-morph";
import type { Diagnostic, Rule } from "./types";

const OPTION_GETTERS = new Set([
	"getString",
	"getInteger",
	"getNumber",
	"getBoolean",
	"getUser",
	"getChannel",
	"getRole",
	"getMentionable",
	"getAttachment",
]);

export const preferTypedOptions: Rule = {
	name: "prefer-typed-options",
	description:
		"Prefer typed options parameter in .run() over interaction.options.getXxx()",

	check(sourceFile: SourceFile): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		sourceFile.forEachDescendant((node) => {
			if (!Node.isCallExpression(node)) return;

			const expr = node.getExpression();
			if (!Node.isPropertyAccessExpression(expr)) return;

			const methodName = expr.getName();
			if (!OPTION_GETTERS.has(methodName)) return;

			// Check the receiver is `something.options`
			const receiver = expr.getExpression();
			if (!Node.isPropertyAccessExpression(receiver)) return;
			if (receiver.getName() !== "options") return;

			const pos = sourceFile.getLineAndColumnAtPos(node.getStart());
			diagnostics.push({
				file: sourceFile.getFilePath(),
				line: pos.line,
				column: pos.column,
				message: `Prefer typed options over interaction.options.${methodName}() — declare the option with .add${methodName.replace("get", "")}Option() and use the options parameter in .run()`,
				fixable: false,
				severity: "warn",
			});
		});

		return diagnostics;
	},

	fix(_sourceFile: SourceFile): number {
		return 0;
	},
};
