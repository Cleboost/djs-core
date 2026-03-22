import { expect, test } from "bun:test";
import { cac } from "cac";
import { registerBuildCommand } from "../commands/build";

test("build command registers without throwing", () => {
	const cli = cac("djs-core-test");
	expect(() => registerBuildCommand(cli)).not.toThrow();
	const anyCli = cli as any;
	const cmds = anyCli.commands || anyCli._commands || [];
	const hasBuild =
		Array.isArray(cmds) &&
		cmds.some((c: any) => c?.name === "build" || c?.command === "build");

	expect(hasBuild).toBeTruthy();
});
