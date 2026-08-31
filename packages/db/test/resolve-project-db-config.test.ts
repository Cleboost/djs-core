import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { syncDrizzleKitConfig } from "../drizzle-kit";
import {
	resolveProjectDbConfig,
	resolveProjectDbDialect,
} from "../resolve-project-db-config";

describe("resolveProjectDbConfig", () => {
	const fixtureRoot = join(import.meta.dir, "fixtures", "config-throws-token");

	test("reads db block without executing TOKEN guard", async () => {
		const previousToken = process.env.TOKEN;
		delete process.env.TOKEN;

		const db = await resolveProjectDbConfig(fixtureRoot);
		expect(db?.dialect).toBe("postgresql");
		expect(db?.autoMigrate).toBe(true);

		if (previousToken === undefined) delete process.env.TOKEN;
		else process.env.TOKEN = previousToken;
	});

	test("resolveProjectDbDialect ignores TOKEN guard", async () => {
		const previousToken = process.env.TOKEN;
		delete process.env.TOKEN;

		const dialect = await resolveProjectDbDialect(fixtureRoot);
		expect(dialect).toBe("postgresql");

		if (previousToken === undefined) delete process.env.TOKEN;
		else process.env.TOKEN = previousToken;
	});

	test("syncDrizzleKitConfig writes .djscore/drizzle.kit.ts without TOKEN", async () => {
		const previousToken = process.env.TOKEN;
		delete process.env.TOKEN;

		const synced = await syncDrizzleKitConfig(fixtureRoot);
		expect(synced).toBe(true);

		const kitPath = join(fixtureRoot, ".djscore", "drizzle.kit.ts");
		const content = await Bun.file(kitPath).text();
		expect(content).toContain("postgresql");

		if (previousToken === undefined) delete process.env.TOKEN;
		else process.env.TOKEN = previousToken;
	});
});
