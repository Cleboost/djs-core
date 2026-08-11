import { validatePluginRuntime } from "./plugin-compat";

type AnyPlugin = {
	name: string;
	packageName?: string;
	// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin loading
	setup: (...args: any[]) => any;
	// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin loading
	[key: string]: any;
};

function findPluginExport(mod: unknown): AnyPlugin | undefined {
	return Object.values(mod as object).find(
		// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin loading
		(v: any) => v && typeof v === "object" && "name" in v && "setup" in v,
	) as AnyPlugin | undefined;
}

export async function resolvePlugin(
	input: unknown,
	projectRoot = process.cwd(),
): Promise<AnyPlugin | undefined> {
	let plugin: AnyPlugin | undefined;

	if (
		input instanceof Promise ||
		(input && typeof input === "object" && "then" in (input as object))
	) {
		const mod = await (input as Promise<unknown>);
		plugin = findPluginExport(mod);
	} else {
		plugin = input as AnyPlugin | undefined;
	}

	if (!plugin) return undefined;

	if (!validatePluginRuntime(plugin, projectRoot)) return undefined;

	return plugin;
}
