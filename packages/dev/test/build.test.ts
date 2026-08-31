import { expect, test } from "bun:test";
import { cac } from "cac";
import { buildGeneratedEntry, registerBuildCommand } from "../commands/build";

test("build command registers without throwing", () => {
	const cli = cac("djs-core-test");
	expect(() => registerBuildCommand(cli)).not.toThrow();
	// biome-ignore lint/suspicious/noExplicitAny: access cac internals for testing
	const anyCli = cli as any;
	const cmds = anyCli.commands || anyCli._commands || [];
	const hasBuild =
		Array.isArray(cmds) &&
		// biome-ignore lint/suspicious/noExplicitAny: access cac internals for testing
		cmds.some((c: any) => c?.name === "build" || c?.command === "build");

	expect(hasBuild).toBeTruthy();
});

test("buildGeneratedEntry registers modals like dev and start", () => {
	const genDir = "/project/.djscore";
	const modalsDir = "/project/src/components/modals";
	const modalFile = "/project/src/components/modals/demo.ts";

	const code = buildGeneratedEntry({
		genDir,
		commandsDir: "/project/src/interactions/commands",
		buttonsDir: "/project/src/components/buttons",
		contextsDir: "/project/src/interactions/contexts",
		selectsDir: "/project/src/components/selects",
		modalsDir,
		commandFiles: [],
		buttonFiles: [],
		contextFiles: [],
		selectFiles: [],
		modalFiles: [modalFile],
		eventFiles: [],
		cronFiles: [],
		hasCronEnabled: false,
		hasUserConfigEnabled: false,
		hasBundleEnabled: false,
		hasDbEnabled: false,
	});

	expect(code).toContain(
		'import mod_demo from "../src/components/modals/demo.ts";',
	);
	expect(code).toContain("const modals = [");
	expect(code).toContain("mod_demo,");
	expect(code).toContain('mod_demo.setCustomId("demo");');
	expect(code).toContain("client.modalsHandler.set(modals);");
});
