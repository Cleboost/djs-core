// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin loading
type AnyPlugin = {
	name: string;
	setup: (...args: any[]) => any;
	[key: string]: any;
};

export async function resolvePlugin(
	input: unknown,
): Promise<AnyPlugin | undefined> {
	if (
		input instanceof Promise ||
		(input && typeof input === "object" && "then" in (input as object))
	) {
		const mod = await (input as Promise<unknown>);
		return Object.values(mod as object).find(
			// biome-ignore lint/suspicious/noExplicitAny: dynamic plugin loading
			(v: any) => v && typeof v === "object" && "name" in v && "setup" in v,
		) as AnyPlugin | undefined;
	}
	return input as AnyPlugin | undefined;
}
