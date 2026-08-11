import type { APIRoute } from "astro";
import { buildSearchIndex } from "@lib/build-search-index";

export const GET: APIRoute = async () => {
	const index = await buildSearchIndex();
	return new Response(JSON.stringify(index), {
		headers: { "Content-Type": "application/json" },
	});
};
