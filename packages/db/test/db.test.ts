import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeDb } from "../close";
import type { DbConfig } from "../config";
import { createDb } from "../create";
import { migrateDb } from "../migrate";
import { clearDbRoot, resolveMigrationsFolder } from "../paths";

describe("@djs-core/db", () => {
	let tempDir: string;
	let previousCwd: string;

	beforeEach(() => {
		clearDbRoot();
	});

	afterEach(() => {
		clearDbRoot();
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
		await closeDb(db);
	});

	test("migrateDb throws when migrations folder is missing", async () => {
		const fixtureRoot = join(import.meta.dir, "fixtures", "db-project");
		previousCwd = process.cwd();
		process.chdir(fixtureRoot);

		const db = await createDb({
			dialect: "sqlite",
			url: join(fixtureRoot, "migrate-test.db"),
		});

		await expect(
			migrateDb(db, { dialect: "sqlite", autoMigrate: true }),
		).rejects.toThrow("no migrations folder found");

		await closeDb(db);
	});

	test("closeDb closes sqlite client", async () => {
		const fixtureRoot = join(import.meta.dir, "fixtures", "db-project");
		previousCwd = process.cwd();
		process.chdir(fixtureRoot);

		const db = await createDb({
			dialect: "sqlite",
			url: join(fixtureRoot, "close-test.db"),
		});

		const client = db.$client as { close: () => void };
		const closeSpy = mock(client.close.bind(client));
		client.close = closeSpy;

		await closeDb(db);
		expect(closeSpy).toHaveBeenCalled();
	});
});
