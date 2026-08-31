import { splitRoute } from "@djs-core/runtime";

export function parseRoute(route: string): {
	commandName: string;
	subcommandGroup: string | null;
	subcommand: string | null;
} {
	const parts = splitRoute(route);
	return {
		commandName: parts[0] ?? "",
		subcommandGroup: parts.length >= 3 ? (parts[1] ?? null) : null,
		subcommand:
			parts.length >= 3
				? (parts[2] ?? null)
				: parts.length === 2
					? (parts[1] ?? null)
					: null,
	};
}
