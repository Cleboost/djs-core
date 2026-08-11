import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tempDir: string;

afterEach(() => {
	if (tempDir) rmSync(tempDir, { recursive: true, force: true });
});

test("bundled bot without db excludes drizzle runtime chunk", async () => {
	tempDir = mkdtempSync(join(tmpdir(), "djs-bundle-nodb-"));
	const runtimeEntry = join(import.meta.dir, "..", "index.ts");
	writeFileSync(
		join(tempDir, "djs.config.ts"),
		"export default { token: 'test', servers: [] };\n",
	);
	writeFileSync(
		join(tempDir, "entry.ts"),
		`import config from "./djs.config.ts";
import { DjsClient } from "${runtimeEntry}";
const client = new DjsClient({ djsConfig: config });
await client.waitForReady();
`,
	);

	const result = await Bun.build({
		entrypoints: [join(tempDir, "entry.ts")],
		target: "bun",
		minify: true,
	});

	expect(result.success).toBe(true);
	const bundle = await result.outputs[0]?.text();
	expect(bundle).toBeDefined();
	expect(bundle.includes("createSqliteDb")).toBe(false);
	expect(bundle.includes("prepareClientDb")).toBe(false);
});
