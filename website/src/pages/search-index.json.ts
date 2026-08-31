import { buildSearchIndex } from "@lib/build-search-index";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
	const index = await buildSearchIndex();
	return new Response(JSON.stringify(index), {
		headers: { "Content-Type": "application/json" },
	});
};
