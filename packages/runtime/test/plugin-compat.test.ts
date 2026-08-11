import { afterEach, describe, expect, mock, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import semver from "semver";
import {
	RUNTIME_PACKAGE_NAME,
	RUNTIME_VERSION,
	validatePluginRuntime,
} from "../utils/plugin-compat";
import { resolvePlugin } from "../utils/plugin-resolver";

function makeProjectWithPlugin(peerRange: string, runtimeVersion = RUNTIME_VERSION) {
	const root = resolve(
		tmpdir(),
		`djs-plugin-compat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
	);
	const pluginDir = resolve(root, "node_modules", "@djs-core", "plugin-test");
	mkdirSync(pluginDir, { recursive: true });

	writeFileSync(
		resolve(pluginDir, "package.json"),
		JSON.stringify({
			name: "@djs-core/plugin-test",
			peerDependencies: {
				[RUNTIME_PACKAGE_NAME]: peerRange,
			},
		}),
	);

	return { root, pluginDir, runtimeVersion };
}

describe("validatePluginRuntime", () => {
	afterEach(() => {
		mock.restore();
	});

	test("accepts when installed runtime satisfies peer range", () => {
		const { root } = makeProjectWithPlugin(`>=${RUNTIME_VERSION}`);
		const plugin = {
			name: "test",
			packageName: "@djs-core/plugin-test",
		};

		expect(validatePluginRuntime(plugin, root)).toBe(true);
	});

	test("rejects when runtime is below peer range", () => {
		const nextMajor = `${semver.major(RUNTIME_VERSION) + 1}.0.0`;
		const { root } = makeProjectWithPlugin(`>=${nextMajor}`);

		expect(
			validatePluginRuntime(
				{ name: "test", packageName: "@djs-core/plugin-test" },
				root,
			),
		).toBe(false);
	});

	test("rejects plugin without packageName", () => {
		expect(validatePluginRuntime({ name: "broken" })).toBe(false);
	});

	test("rejects plugin without runtime peerDependency", () => {
		const root = resolve(
			tmpdir(),
			`djs-plugin-compat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		);
		const pluginDir = resolve(root, "node_modules", "@djs-core", "plugin-test");
		mkdirSync(pluginDir, { recursive: true });
		writeFileSync(
			resolve(pluginDir, "package.json"),
			JSON.stringify({ name: "@djs-core/plugin-test" }),
		);

		expect(
			validatePluginRuntime(
				{ name: "test", packageName: "@djs-core/plugin-test" },
				root,
			),
		).toBe(false);
	});
});

describe("resolvePlugin", () => {
	test("returns undefined when runtime peer range is not satisfied", async () => {
		const nextMajor = `${semver.major(RUNTIME_VERSION) + 1}.0.0`;
		const { root } = makeProjectWithPlugin(`>=${nextMajor}`);

		const plugin = await resolvePlugin(
			{
				name: "test",
				packageName: "@djs-core/plugin-test",
				setup: () => ({}),
			},
			root,
		);

		expect(plugin).toBeUndefined();
	});

	test("returns plugin when runtime peer range is satisfied", async () => {
		const { root } = makeProjectWithPlugin(`>=${RUNTIME_VERSION}`);

		const plugin = await resolvePlugin(
			{
				name: "test",
				packageName: "@djs-core/plugin-test",
				setup: () => ({ ok: true }),
			},
			root,
		);

		expect(plugin?.name).toBe("test");
	});
});
