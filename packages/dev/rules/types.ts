import type { SourceFile } from "ts-morph";

export type Severity = "error" | "warn";

export type Diagnostic = {
	file: string;
	line: number;
	column: number;
	message: string;
	fixable: boolean;
	severity: Severity;
};

export interface Rule {
	name: string;
	description: string;
	check(sourceFile: SourceFile): Diagnostic[];
	fix(sourceFile: SourceFile): number;
}
