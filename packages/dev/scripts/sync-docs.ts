/**
 * Copies documentation from the monorepo docs/ folder into packages/dev/docs/
 * so the published npm package includes readable Markdown for AI agents.
 * MDX files are renamed to .md (the JSX components remain as-is but are still
 * readable as plain text by language models).
 */
import fs from "node:fs/promises";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dir, "../../..");
const SRC = path.join(REPO_ROOT, "website/src/content/docs");
const DEST = path.join(import.meta.dir, "../docs");

const SKIP_EXTENSIONS = new Set([
	".png",
	".jpg",
	".jpeg",
	".gif",
	".webp",
	".svg",
	".ico",
	".json",
]);
const SKIP_FILES = new Set([".mintignore", "LICENSE", "config.ts"]);

async function copy(src: string, dest: string): Promise<number> {
	let count = 0;
	await fs.mkdir(dest, { recursive: true });

	for (const entry of await fs.readdir(src, { withFileTypes: true })) {
		if (SKIP_FILES.has(entry.name)) continue;

		const srcPath = path.join(src, entry.name);
		const ext = path.extname(entry.name).toLowerCase();

		if (entry.isDirectory()) {
			count += await copy(srcPath, path.join(dest, entry.name));
		} else if (!SKIP_EXTENSIONS.has(ext)) {
			// Rename .mdx → .md for plain Markdown readability
			const destName = entry.name.endsWith(".mdx")
				? `${entry.name.slice(0, -4)}.md`
				: entry.name;
			await fs.copyFile(srcPath, path.join(dest, destName));
			count++;
		}
	}

	return count;
}

// Clean the destination first so removed docs don't linger
try {
	await fs.rm(DEST, { recursive: true, force: true });
} catch {}

const count = await copy(SRC, DEST);
console.log(`  synced ${count} doc files → packages/dev/docs/`);
