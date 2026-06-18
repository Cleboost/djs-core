import type { SourceFile } from "ts-morph";
import { Node, SyntaxKind } from "ts-morph";
import type { Diagnostic, Rule } from "./types";

export const noEphemeral: Rule = {
	name: "no-ephemeral",
	description:
		"Replace deprecated ephemeral: true with flags: [MessageFlags.Ephemeral]",

	check(sourceFile: SourceFile): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];

		sourceFile.forEachDescendant((node) => {
			if (!Node.isPropertyAssignment(node)) return;

			const name = node.getName();
			if (name !== "ephemeral") return;

			const value = node.getInitializer();
			if (!value || value.getKind() !== SyntaxKind.TrueKeyword) return;

			const pos = sourceFile.getLineAndColumnAtPos(node.getStart());
			diagnostics.push({
				file: sourceFile.getFilePath(),
				line: pos.line,
				column: pos.column,
				message:
					"ephemeral: true is deprecated — use flags: [MessageFlags.Ephemeral]",
				fixable: true,
				severity: "error",
			});
		});

		return diagnostics;
	},

	fix(sourceFile: SourceFile): number {
		let count = 0;

		const nodes = sourceFile
			.getDescendants()
			.filter(
				(node) =>
					Node.isPropertyAssignment(node) &&
					node.getName() === "ephemeral" &&
					node.getInitializer()?.getKind() === SyntaxKind.TrueKeyword,
			);

		for (const node of nodes) {
			if (!Node.isPropertyAssignment(node)) continue;
			node.set({ name: "flags", initializer: "[MessageFlags.Ephemeral]" });
			count++;
		}

		if (count === 0) return 0;

		// Ensure MessageFlags is imported from discord.js
		const existing = sourceFile.getImportDeclaration(
			(decl) => decl.getModuleSpecifierValue() === "discord.js",
		);

		if (existing) {
			const named = existing.getNamedImports().map((i) => i.getName());
			if (!named.includes("MessageFlags")) {
				existing.addNamedImport("MessageFlags");
			}
		} else {
			sourceFile.addImportDeclaration({
				moduleSpecifier: "discord.js",
				namedImports: ["MessageFlags"],
			});
		}

		sourceFile.saveSync();
		return count;
	},
};
