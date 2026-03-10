/**
 * Splits a route string into its parts.
 * Example: "admin.moderation.kick" -> ["admin", "moderation", "kick"]
 */
export function splitRoute(route: string): string[] {
	return route
		.split(".")
		.map((s) => s.trim())
		.filter(Boolean);
}

/**
 * Gets the root part of a route.
 * Example: "admin.moderation.kick" -> "admin"
 */
export function getRoot(route: string): string {
	const parts = splitRoute(route);
	const root = parts[0];
	if (!root) {
		throw new Error(`Route '${route}' has no root part`);
	}
	return root;
}

/**
 * Gets the leaf part of a route.
 * Example: "admin.moderation.kick" -> "kick"
 */
export function getLeaf(route: string): string | undefined {
	const parts = splitRoute(route);
	return parts.pop();
}
