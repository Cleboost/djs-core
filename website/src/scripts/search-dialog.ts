import { navigate } from "astro:transitions/client";
import { docHref, searchDocuments, type SearchDocument } from "@lib/search";
import { iconSvg } from "@lib/icons";
import { saveSidebarScroll } from "./sidebar-scroll";

const dialog = document.getElementById("search-dialog") as HTMLDialogElement | null;
const input = document.getElementById("search-input") as HTMLInputElement | null;
const results = document.getElementById("search-results");
const empty = document.getElementById("search-empty");
const label = document.getElementById("search-results-label");

let index: SearchDocument[] | null = null;
let activeIndex = -1;
let currentMatches: SearchDocument[] = [];

const SUGGESTED_SLUGS = [
	"",
	"getting-started/installation",
	"interaction/commands",
	"components/buttons",
	"essentials/plugins",
	"interaction",
	"components",
];

async function loadIndex(): Promise<SearchDocument[]> {
	if (index) return index;
	const response = await fetch("/search-index.json");
	if (!response.ok) throw new Error("Failed to load search index");
	index = (await response.json()) as SearchDocument[];
	return index;
}

function getSuggestions(): SearchDocument[] {
	if (!index) return [];
	const bySlug = new Map(index.map((doc) => [doc.slug, doc]));
	return SUGGESTED_SLUGS.map((slug) => bySlug.get(slug)).filter(
		(doc): doc is SearchDocument => Boolean(doc),
	);
}

function openDialog() {
	if (!dialog) return;
	dialog.showModal();
	document.body.classList.add("no-scroll");
	requestAnimationFrame(() => input?.focus());
	renderResults("");
}

function closeDialog() {
	if (!dialog?.open) return;
	dialog.close();
	document.body.classList.remove("no-scroll");
	activeIndex = -1;
	currentMatches = [];
	if (input) input.value = "";
	renderResults("");
}

function createResultButton(doc: SearchDocument, i: number): HTMLButtonElement {
	const button = document.createElement("button");
	button.type = "button";
	button.className = "search-result" + (i === activeIndex ? " active" : "");
	button.dataset.index = String(i);

	const icon = document.createElement("span");
	icon.className = "search-result-icon";
	icon.innerHTML = iconSvg(doc.icon ?? "file-text", 18);

	const content = document.createElement("span");
	content.className = "search-result-content";

	const title = document.createElement("span");
	title.className = "search-result-title";
	title.textContent = doc.title;

	const meta = document.createElement("span");
	meta.className = "search-result-meta";

	if (doc.section) {
		const badge = document.createElement("span");
		badge.className = "search-result-badge";
		badge.textContent = doc.section;
		meta.appendChild(badge);
	}

	if (doc.description) {
		const desc = document.createElement("span");
		desc.className = "search-result-desc";
		desc.textContent = doc.description;
		meta.appendChild(desc);
	}

	content.append(title, meta);

	const arrow = document.createElement("span");
	arrow.className = "search-result-arrow";
	arrow.innerHTML = iconSvg("chevron-right", 16);
	arrow.setAttribute("aria-hidden", "true");

	button.append(icon, content, arrow);
	button.addEventListener("click", () => navigateTo(doc.slug));
	return button;
}

function renderResults(query: string) {
	if (!results || !empty || !index) return;

	const trimmed = query.trim();
	const matches = trimmed ? searchDocuments(index, query) : getSuggestions();
	currentMatches = matches;

	results.innerHTML = "";
	activeIndex = matches.length > 0 ? 0 : -1;

	if (label) {
		label.textContent = trimmed ? "Results" : "Suggested";
		label.hidden = matches.length === 0;
	}

	if (matches.length === 0) {
		empty.hidden = !trimmed;
		empty.textContent = trimmed ? `No results for "${trimmed}"` : "";
		return;
	}

	empty.hidden = true;

	for (const [i, doc] of matches.entries()) {
		const li = document.createElement("li");
		li.appendChild(createResultButton(doc, i));
		results.appendChild(li);
	}
}

function navigateTo(slug: string) {
	closeDialog();
	saveSidebarScroll();
	navigate(docHref(slug));
}

function setActive(index: number) {
	if (!results) return;
	const buttons = results.querySelectorAll<HTMLButtonElement>(".search-result");
	if (buttons.length === 0) return;
	activeIndex = Math.max(0, Math.min(index, buttons.length - 1));
	buttons.forEach((button, i) => button.classList.toggle("active", i === activeIndex));
	buttons[activeIndex]?.scrollIntoView({ block: "nearest" });
}

function init() {
	if (!dialog || !input || !results || !empty) return;

	document.addEventListener("click", (event) => {
		const trigger = (event.target as Element).closest("[data-search-open]");
		if (!trigger) return;
		loadIndex()
			.then(() => openDialog())
			.catch(() => {
				empty.hidden = false;
				empty.textContent = "Search is unavailable right now.";
				openDialog();
			});
	});

	dialog.addEventListener("close", () => {
		document.body.classList.remove("no-scroll");
	});

	dialog.addEventListener("cancel", (event) => {
		event.preventDefault();
		closeDialog();
	});

	input.addEventListener("input", () => {
		if (!index) return;
		renderResults(input.value);
	});

	input.addEventListener("keydown", (event) => {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setActive(activeIndex + 1);
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			setActive(activeIndex - 1);
		} else if (event.key === "Enter" && activeIndex >= 0) {
			event.preventDefault();
			const doc = currentMatches[activeIndex];
			if (doc) navigateTo(doc.slug);
		}
	});

	document.addEventListener("keydown", (event) => {
		const modKey = event.metaKey || event.ctrlKey;
		if (modKey && event.key.toLowerCase() === "k") {
			event.preventDefault();
			if (dialog.open) closeDialog();
			else {
				loadIndex()
					.then(() => openDialog())
					.catch(() => openDialog());
			}
		}
	});

	loadIndex().catch(() => {});
}

init();
