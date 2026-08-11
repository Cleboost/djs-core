import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
	resolveDbDialectFromConfig,
	scaffoldDbProject,
	syncDrizzleKitConfig,
} from "@djs-core/db";
import type { CAC } from "cac";
import pc from "picocolors";

const KIT_ACTIONS: Record<string, string[]> = {
	generate: ["drizzle-kit", "generate"],
	migrate: ["drizzle-kit", "migrate"],
	push: ["drizzle-kit", "push"],
	studio: ["drizzle-kit", "studio"],
	pull: ["drizzle-kit", "pull"],
};

export function registerDbCommand(cli: CAC) {
	cli
		.command("db <action>", "Database helper commands (Drizzle)")
		.action(async (action: string) => {
			const root = process.cwd();

			if (action === "init") {
				const dialect = await resolveDbDialectFromConfig(root);
				scaffoldDbProject(root, dialect);
				console.log(`${pc.green("\n✓")}  Database scaffolded in db/`);
				console.log("  1. Edit db/schema.ts to define your tables");
				console.log("  2. Run: djs-core db generate");
				console.log("  3. Run: djs-core db migrate");
				console.log("  4. Use interaction.client.db in your commands\n");
				return;
			}

			const kitArgs = KIT_ACTIONS[action];
			if (!kitArgs) {
				console.error(pc.red(`\nUnknown db action: ${action}`));
				console.log(
					`Available actions: init, ${Object.keys(KIT_ACTIONS).join(", ")}\n`,
				);
				process.exit(1);
			}

			const synced = await syncDrizzleKitConfig(root);
			if (!synced && !existsSync(resolve(root, ".djscore/drizzle.kit.ts"))) {
				console.warn(
					pc.yellow(
						"⚠️  Could not read djs.config.ts — using existing .djscore/drizzle.kit.ts if present",
					),
				);
			}

			const result = spawnSync("bunx", kitArgs, {
				stdio: "inherit",
				cwd: root,
			});
			process.exit(result.status ?? 1);
		});
}
