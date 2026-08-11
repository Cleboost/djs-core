#!/usr/bin/env bun
/**
 * Publish plugin packages whose version is not already on npm.
 * In CI: uses npm OIDC trusted publishing (no token) + --provenance.
 *
 * Usage:
 *   bun scripts/publish-plugins.ts plugins/plugin-sql plugins/plugin-drizzle
 *   CHANGED_PLUGINS="plugins/plugin-sql\nplugins/plugin-drizzle" bun scripts/publish-plugins.ts
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const isCi = Boolean(process.env.GITHUB_ACTIONS || process.env.GITLAB_CI);

function run(cmd: string, args: string[], cwd?: string): boolean {
	const result = spawnSync(cmd, args, {
		cwd,
		encoding: "utf-8",
		stdio: "inherit",
	});
	return result.status === 0;
}

function isPublished(name: string, version: string): boolean {
	const result = spawnSync("npm", ["view", `${name}@${version}`, "version"], {
		encoding: "utf-8",
	});
	return result.status === 0;
}

function publishPlugin(dir: string): boolean {
	const abs = resolve(dir);
	const pkgPath = resolve(abs, "package.json");

	if (!existsSync(pkgPath)) {
		console.error(`[publish-plugins] No package.json in ${dir}`);
		return false;
	}

	const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
		name: string;
		version: string;
		private?: boolean;
	};

	if (pkg.private) {
		console.log(`Skipping ${pkg.name}@${pkg.version} (private)`);
		return true;
	}

	if (isPublished(pkg.name, pkg.version)) {
		console.log(
			`Skipping ${pkg.name}@${pkg.version} (already on npm — version not new)`,
		);
		return true;
	}

	const pack = spawnSync("bun", ["pm", "pack", "--quiet"], {
		cwd: abs,
		encoding: "utf-8",
	});

	if (pack.status !== 0) {
		console.error(`[publish-plugins] pack failed for ${pkg.name}`);
		return false;
	}

	const packFile = pack.stdout
		.split("\n")
		.map((line) => line.trim())
		.find((line) => line.endsWith(".tgz"));

	if (!packFile) {
		console.error(`[publish-plugins] no tarball produced for ${pkg.name}`);
		return false;
	}

	console.log(`Publishing ${pkg.name}@${pkg.version} from ${abs}/${packFile}`);

	const publishArgs = ["publish", packFile, "--access", "public"];
	if (isCi) {
		publishArgs.push("--provenance");
	}

	return run("npm", publishArgs, abs);
}

function resolveTargetDirs(): string[] {
	const fromEnv = process.env.CHANGED_PLUGINS?.split("\n").filter(Boolean);
	if (fromEnv && fromEnv.length > 0) {
		return fromEnv;
	}

	if (process.argv.length > 2) {
		return process.argv.slice(2);
	}

	const root = resolve(import.meta.dir, "..", "plugins");
	return Bun.glob("*/package.json", { cwd: root }).map((file) =>
		resolve(root, file.replace("/package.json", "")),
	);
}

const dirs = resolveTargetDirs();

if (dirs.length === 0) {
	console.log("[publish-plugins] No plugin directories to publish.");
	process.exit(0);
}

let failed = false;

for (const dir of dirs) {
	if (!publishPlugin(dir)) {
		failed = true;
	}
}

process.exit(failed ? 1 : 0);
