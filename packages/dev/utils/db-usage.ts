import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const DB_BUNDLE_EXTERNALS = [
	"@djs-core/db",
	"@djs-core/db/runtime",
	"drizzle-orm",
	"postgres",
	"mysql2",
	"@libsql/client",
] as const;

export function usesDbInSource(root: string): boolean {
	const srcDir = resolve(root, "src");
	if (!existsSync(srcDir)) return false;

	const scan = (dir: string): boolean => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const full = resolve(dir, entry.name);
			if (entry.isDirectory()) {
				if (scan(full)) return true;
				continue;
			}
			if (!entry.name.endsWith(".ts") || entry.name.endsWith(".d.ts")) continue;
			const content = readFileSync(full, "utf-8");
			if (content.includes("@djs-core/db") || content.includes(".client.db")) {
				return true;
			}
		}
		return false;
	};

	try {
		return scan(srcDir);
	} catch {
		return false;
	}
}

export function projectNeedsDb(
	root: string,
	hasDbInConfig: boolean,
): boolean {
	return hasDbInConfig || usesDbInSource(root);
}
