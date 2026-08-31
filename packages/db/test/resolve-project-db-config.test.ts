import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { syncDrizzleKitConfig } from "../drizzle-kit";
import {
	parseDbConfigFromSource,
	resolveProjectDbConfig,
	resolveProjectDbDialect,
} from "../resolve-project-db-config";

describe("parseDbConfigFromSource", () => {
	test("rejects executable payloads in db block", () => {
		const db = parseDbConfigFromSource(`export default {
  db: {
    dialect: "sqlite",
    autoMigrate: (() => { throw new Error("pwned"); })(),
  },
};`);
		expect(db).toBeUndefined();
	});

	test("rejects unknown db keys", () => {
		const db = parseDbConfigFromSource(`export default {
  db: {
    dialect: "sqlite",
    evil: true,
  },
};`);
		expect(db).toBeUndefined();
	});

	test("parses env substitution and trailing commas", () => {
		const previous = process.env.DATABASE_URL;
		process.env.DATABASE_URL = "postgresql://new-host/db";

		const db = parseDbConfigFromSource(`export default {
  db: {
    dialect: "postgresql",
    url: process.env.DATABASE_URL,
    autoMigrate: true,
  },
};`);

		if (previous === undefined) delete process.env.DATABASE_URL;
		else process.env.DATABASE_URL = previous;

		expect(db).toEqual({
			dialect: "postgresql",
			url: "postgresql://new-host/db",
			autoMigrate: true,
		});
	});

	test("rejects Function constructor payloads", () => {
		const db = parseDbConfigFromSource(`export default {
  db: {
    dialect: "sqlite",
    autoMigrate: Function("return true")(),
  },
};`);
		expect(db).toBeUndefined();
	});
});

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
