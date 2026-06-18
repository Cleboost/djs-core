import { Project } from "ts-morph";
import { describe, expect, it } from "bun:test";
import { noGenericConstructor } from "../rules/no-generic-constructor";

function makeFile(project: Project, content: string) {
	return project.createSourceFile("test.ts", content, { overwrite: true });
}

describe("no-generic-constructor", () => {
	it("detects new Button<T>()", () => {
		const project = new Project({ useInMemoryFileSystem: true });
		const file = makeFile(
			project,
			`import { Button } from "@djs-core/runtime";
export default new Button<{ userId: string }>().run(async () => {});
`,
		);
		const diagnostics = noGenericConstructor.check(file);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0].severity).toBe("warn");
		expect(diagnostics[0].fixable).toBe(true);
		expect(diagnostics[0].message).toContain("withData");
	});

	it("detects new StringSelectMenu<T>()", () => {
		const project = new Project({ useInMemoryFileSystem: true });
		const file = makeFile(
			project,
			`import { StringSelectMenu } from "@djs-core/runtime";
export default new StringSelectMenu<{ category: string }>().run(async () => {});
`,
		);
		const diagnostics = noGenericConstructor.check(file);
		expect(diagnostics).toHaveLength(1);
	});

	it("does not flag new Button() without type argument", () => {
		const project = new Project({ useInMemoryFileSystem: true });
		const file = makeFile(
			project,
			`import { Button } from "@djs-core/runtime";
export default new Button().withData<{ userId: string }>().run(async () => {});
`,
		);
		const diagnostics = noGenericConstructor.check(file);
		expect(diagnostics).toHaveLength(0);
	});

	it("does not flag unrelated classes with generics", () => {
		const project = new Project({ useInMemoryFileSystem: true });
		const file = makeFile(
			project,
			`class MyClass<T> {}
const x = new MyClass<string>();
`,
		);
		const diagnostics = noGenericConstructor.check(file);
		expect(diagnostics).toHaveLength(0);
	});

	it("fix rewrites new Button<T>() to new Button().withData<T>()", () => {
		const project = new Project({ useInMemoryFileSystem: true });
		const file = makeFile(
			project,
			`import { Button } from "@djs-core/runtime";
export default new Button<{ userId: string }>().run(async () => {});
`,
		);
		const fixed = noGenericConstructor.fix(file);
		expect(fixed).toBe(1);
		const text = file.getText();
		expect(text).toContain("new Button().withData<{ userId: string }>()");
		expect(text).not.toContain("new Button<");
	});

	it("fix handles multiple components in the same file", () => {
		const project = new Project({ useInMemoryFileSystem: true });
		const file = makeFile(
			project,
			`import { Button, Modal } from "@djs-core/runtime";
const b = new Button<{ x: string }>().run(async () => {});
const m = new Modal<{ y: number }>().run(async () => {});
`,
		);
		const fixed = noGenericConstructor.fix(file);
		expect(fixed).toBe(2);
		const text = file.getText();
		expect(text).toContain("new Button().withData<{ x: string }>()");
		expect(text).toContain("new Modal().withData<{ y: number }>()");
	});
});
