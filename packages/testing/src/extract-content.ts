export function extractContent(payload: unknown): string | null {
	if (payload == null) return null;
	if (typeof payload === "string") return payload;
	if (typeof payload !== "object") return String(payload);

	const obj = payload as Record<string, unknown>;
	if (typeof obj.content === "string") return obj.content;
	if (Array.isArray(obj.embeds) && obj.embeds.length > 0) {
		const embed = obj.embeds[0] as Record<string, unknown>;
		if (typeof embed.description === "string") return embed.description;
		if (typeof embed.title === "string") return embed.title;
	}
	return null;
}
