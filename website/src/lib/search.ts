export interface SearchDocument {
	title: string;
	description?: string;
	slug: string;
	section?: string;
	icon?: string;
	content: string;
}

export function stripMarkdown(source: string): string {
	return source
		.replace(/^---[\s\S]*?---/m, "")
		.replace(/^import\s+.+$/gm, "")
		.replace(/<[A-Z][^>]*\/?>/g, " ")
		.replace(/<\/[A-Z][^>]*>/g, " ")
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/`[^`]+`/g, " ")
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.replace(/[#*_~>|]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export function searchDocuments(
	docs: SearchDocument[],
	query: string,
	limit = 8,
): SearchDocument[] {
	const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
	if (terms.length === 0) return [];

	return docs
		.map((doc) => {
			let score = 0;
			const title = doc.title.toLowerCase();
			const description = (doc.description ?? "").toLowerCase();
			const content = doc.content.toLowerCase();
			const section = (doc.section ?? "").toLowerCase();

			for (const term of terms) {
				if (title.includes(term)) score += 12;
				if (description.includes(term)) score += 6;
				if (section.includes(term)) score += 4;
				if (content.includes(term)) score += 1;
			}

			return { doc, score };
		})
		.filter((result) => result.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((result) => result.doc);
}

export function docHref(slug: string): string {
	return slug ? `/${slug}` : "/";
}
