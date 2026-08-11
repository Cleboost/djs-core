import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import semver from "semver";
import runtimePkg from "../package.json";
import { pluginLog } from "./logger";

export const RUNTIME_PACKAGE_NAME = "@djs-core/runtime";
export const RUNTIME_VERSION = runtimePkg.version;

interface PluginPackageJson {
	name?: string;
	peerDependencies?: Record<string, string>;
}

function readJsonFile(path: string): PluginPackageJson | undefined {
	try {
		return JSON.parse(readFileSync(path, "utf-8")) as PluginPackageJson;
	} catch {
		return undefined;
	}
}

function resolvePluginPackageJsonPath(
	packageName: string,
	projectRoot = process.cwd(),
): string | undefined {
	const localFolder = packageName.replace("@djs-core/", "");
	const candidates = [
		resolve(projectRoot, "node_modules", packageName, "package.json"),
		resolve(projectRoot, "..", "node_modules", packageName, "package.json"),
		resolve(
			projectRoot,
			"..",
			"..",
			"node_modules",
			packageName,
			"package.json",
		),
		resolve(projectRoot, "..", "..", "plugins", localFolder, "package.json"),
	];

	for (const candidate of candidates) {
		const pkg = readJsonFile(candidate);
		if (pkg?.name === packageName) {
			return candidate;
		}
	}

	try {
		const require = createRequire(import.meta.url);
		return require.resolve(`${packageName}/package.json`);
	} catch {
		return undefined;
	}
}

function readPluginPackageJson(
	packageName: string,
	projectRoot = process.cwd(),
): PluginPackageJson | undefined {
	const path = resolvePluginPackageJsonPath(packageName, projectRoot);
	if (!path) return undefined;
	return readJsonFile(path);
}

export interface PluginRuntimeCheck {
	name: string;
	packageName?: string;
}

/**
 * Validates that the installed @djs-core/runtime version satisfies the plugin's
 * peerDependency range (source of truth for required runtime; see PLUGIN_API_CHANGELOG.md).
 */
export function validatePluginRuntime(
	plugin: PluginRuntimeCheck,
	projectRoot = process.cwd(),
): boolean {
	const log = pluginLog(plugin.name);

	if (!plugin.packageName) {
		log.error(
			"Missing packageName on plugin — cannot read peerDependencies. Plugin not loaded.",
		);
		return false;
	}

	const pkg = readPluginPackageJson(plugin.packageName, projectRoot);
	if (!pkg) {
		log.error(
			`Could not read package.json for ${plugin.packageName}. Plugin not loaded.`,
		);
		return false;
	}

	const peerRange = pkg.peerDependencies?.[RUNTIME_PACKAGE_NAME];
	if (!peerRange) {
		log.error(
			`Missing peerDependency on ${RUNTIME_PACKAGE_NAME} in ${plugin.packageName}. Plugin not loaded.`,
		);
		return false;
	}

	if (
		!semver.satisfies(RUNTIME_VERSION, peerRange, { includePrerelease: true })
	) {
		log.error(
			`Requires ${RUNTIME_PACKAGE_NAME} ${peerRange}, but ${RUNTIME_VERSION} is installed. Upgrade @djs-core/runtime. Plugin not loaded.`,
		);
		return false;
	}

	return true;
}
