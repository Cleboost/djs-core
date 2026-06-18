import { Project } from "ts-morph";
import { describe, expect, it } from "bun:test";
import { requireDescription } from "../rules/require-description";

function makeFile(project: Project, content: string) {
	return project.createSourceFile("test.ts", content, { overwrite: true });
}

describe("require-description", () => {
	it("detects a Command with no .setDescription()", () => {
		const project = new Project({ useInMemoryFileSystem: true });
		const file = makeFile(
			project,
			`
import { Command } from "@djs-core/runtime";
export default new Command()
  .setName("ping")
  .run(async (interaction) => { await interaction.reply("pong"); });
`,
		);
		const diagnostics = requireDescription.check(file);
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0].severity).toBe("warn");
		expect(diagnostics[0].fixable).toBe(true);
	});

	it("does not flag a Command that already has .setDescription()", () => {
		const project = new Project({ useInMemoryFileSystem: true });
		const file = makeFile(
			project,
			`
import { Command } from "@djs-core/runtime";
export default new Command()
  .setDescription("Replies with pong")
  .run(async (interaction) => { await interaction.reply("pong"); });
`,
		);
		const diagnostics = requireDescription.check(file);
		expect(diagnostics).toHaveLength(0);
	});

	it("does not flag non-Command classes named differently", () => {
		const project = new Project({ useInMemoryFileSystem: true });
		const file = makeFile(
			project,
			`
import { Button } from "@djs-core/runtime";
export default new Button().setCustomId("btn").run(async () => {});
`,
		);
		const diagnostics = requireDescription.check(file);
		expect(diagnostics).toHaveLength(0);
	});

	it("fix inserts .setDescription() with default text", () => {
		const project = new Project({ useInMemoryFileSystem: true });
		const file = makeFile(
			project,
			`import { Command } from "@djs-core/runtime";
export default new Command().setName("ping");
`,
		);
		const fixed = requireDescription.fix(file);
		expect(fixed).toBe(1);
		const text = file.getText();
		expect(text).toContain(".setDescription(");
		expect(text).toContain("TODO: add a description");
	});

	it("fix does not touch a Command that already has .setDescription()", () => {
		const project = new Project({ useInMemoryFileSystem: true });
		const original = `import { Command } from "@djs-core/runtime";
export default new Command().setDescription("already set").setName("ping");
`;
		const file = makeFile(project, original);
		const fixed = requireDescription.fix(file);
		expect(fixed).toBe(0);
		expect(file.getText()).toBe(original);
	});
});
