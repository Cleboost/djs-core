/** Returns true if the error is Discord API error 10063 (Unknown Application Command). */
export function isUnknownCommandError(error: unknown): boolean {
	return (
		error !== null &&
		typeof error === "object" &&
		"code" in error &&
		(error as { code: unknown }).code === 10063
	);
}
