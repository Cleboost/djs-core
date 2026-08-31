import { parseRoute } from "./parse-route";

function optionValue<T>(
	options: Record<string, unknown>,
	name: string,
): T | null {
	return name in options ? (options[name] as T) : null;
}

export function createMockOptions(
	optionValues: Record<string, unknown> = {},
	route?: string,
): Record<string, unknown> {
	const routing = route ? parseRoute(route) : null;

	return {
		getSubcommandGroup: () => routing?.subcommandGroup ?? null,
		getSubcommand: () => routing?.subcommand ?? null,
		getString: (name: string) => optionValue<string>(optionValues, name),
		getInteger: (name: string) => optionValue<number>(optionValues, name),
		getNumber: (name: string) => optionValue<number>(optionValues, name),
		getBoolean: (name: string) => optionValue<boolean>(optionValues, name),
		getUser: (name: string) => optionValue<unknown>(optionValues, name),
		getChannel: (name: string) => optionValue<unknown>(optionValues, name),
		getRole: (name: string) => optionValue<unknown>(optionValues, name),
		getMentionable: (name: string) => optionValue<unknown>(optionValues, name),
		getAttachment: (name: string) => optionValue<unknown>(optionValues, name),
		getFocused: () => optionValues.__focused ?? { name: "", value: "" },
	};
}
