import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DbConfig } from "../config";
import { createDb } from "../create";
import { resolveMigrationsFolder } from "../paths";

describe("@djs-core/db", () => {
	let tempDir: string;
	let previousCwd: string;

	afterEach(() => {
		if (tempDir) {
			rmSync(tempDir, { recursive: true, force: true });
		}
		if (previousCwd) {
			process.chdir(previousCwd);
		}
	});

	test("createDb throws when schema is missing", async () => {
		tempDir = mkdtempSync(join(tmpdir(), "djs-db-test-"));
		previousCwd = process.cwd();
		process.chdir(tempDir);

		await expect(createDb({ dialect: "sqlite" })).rejects.toThrow(
			"Schema not found",
		);
	});

	test("resolveMigrationsFolder points to db/migrations", () => {
		tempDir = mkdtempSync(join(tmpdir(), "djs-db-test-"));
		expect(resolveMigrationsFolder(tempDir)).toBe(
			join(tempDir, "db", "migrations"),
		);
	});

	test("createDb connects with sqlite schema", async () => {
		const fixtureRoot = join(import.meta.dir, "fixtures", "db-project");
		previousCwd = process.cwd();
		process.chdir(fixtureRoot);

		const config: DbConfig = {
			dialect: "sqlite",
			url: join(fixtureRoot, "test.db"),
		};

		const db = await createDb(config);
		expect(db).toBeDefined();
		expect(db.select).toBeDefined();
	});
});
