// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin loading
type ResolvedPlugin = any;

export async function resolvePlugin(
	pluginInput: unknown,
): Promise<ResolvedPlugin> {
	if (
		pluginInput instanceof Promise ||
		(pluginInput &&
			typeof pluginInput === "object" &&
			"then" in (pluginInput as object))
	) {
		const mod = await (pluginInput as Promise<unknown>);
		return Object.values(mod as object).find(
			// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin loading
			(v: any) => v && typeof v === "object" && "name" in v && "setup" in v,
		);
	}
	return pluginInput;
}
