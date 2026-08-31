import { getCollection } from "astro:content";
import { flatNav, nav } from "@lib/nav";
import { type SearchDocument, stripMarkdown } from "@lib/search";
import { entrySlug } from "@lib/slug";

const SLUG_ICONS: Record<string, string> = {
	"plugins-marketplace": "sparkles",
	partners: "users",
};

export async function buildSearchIndex(): Promise<SearchDocument[]> {
	const navMeta = new Map(
		flatNav().map((item) => [
			item.slug,
			{ label: item.label, icon: item.icon },
		]),
	);
	const sectionBySlug = new Map<string, string>();

	for (const group of nav) {
		for (const item of group.items) {
			sectionBySlug.set(item.slug, group.label);
		}
	}

	const docs = await getCollection("docs");

	return docs.map((entry) => {
		const slug = entrySlug(entry.id);
		const meta = navMeta.get(slug);

		return {
			title: meta?.label ?? entry.data.title,
			description: entry.data.description,
			slug,
			section: sectionBySlug.get(slug),
			icon: meta?.icon ?? SLUG_ICONS[slug] ?? "file-text",
			content: stripMarkdown(entry.body ?? ""),
		};
	});
}
