import {
	initSidebarScrollPersistence,
	restoreSidebarScroll,
} from "./sidebar-scroll";

function initMobileSidebar(): void {
	const hamburger = document.getElementById("hamburger");
	const sidebar = document.getElementById("sidebar");
	const overlay = document.getElementById("overlay");
	if (!hamburger || !overlay) return;

	const toggleSidebar = () => {
		sidebar?.classList.toggle("open");
		overlay.classList.toggle("visible");
		document.body.classList.toggle("no-scroll");
	};

	hamburger.onclick = toggleSidebar;
	overlay.onclick = toggleSidebar;
}

function initThemeToggle(): void {
	const themeToggle = document.getElementById("theme-toggle");
	if (!themeToggle) return;

	themeToggle.onclick = () => {
		const html = document.documentElement;
		const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
		html.setAttribute("data-theme", next);
		try {
			localStorage.setItem("theme", next);
		} catch (_) {}
	};
}

let tocScrollHandler: (() => void) | null = null;

function initToc(): void {
	const prose = document.getElementById("prose");
	const tocNav = document.getElementById("toc-nav");
	const tocAside = document.getElementById("toc-aside");
	if (!prose || !tocNav || !tocAside) return;

	tocNav.innerHTML = "";
	const headings = Array.from(prose.querySelectorAll("h2, h3")) as HTMLElement[];

	if (headings.length === 0) {
		tocAside.style.display = "none";
		return;
	}

	tocAside.style.display = "";
	headings.forEach((heading) => {
		if (!heading.id) {
			heading.id = heading.textContent!
				.toLowerCase()
				.replace(/\s+/g, "-")
				.replace(/[^\w-]/g, "");
		}
		const link = document.createElement("a");
		link.href = `#${heading.id}`;
		link.textContent = heading.textContent!;
		link.className =
			"toc-link" + (heading.tagName === "H3" ? " toc-link-h3" : "");
		tocNav.appendChild(link);
	});

	const links = Array.from(
		tocNav.querySelectorAll(".toc-link"),
	) as HTMLAnchorElement[];

	const setActive = () => {
		let active = headings[0];
		for (const heading of headings) {
			if (heading.getBoundingClientRect().top <= 120) active = heading;
		}
		links.forEach((link) => link.classList.remove("active"));
		tocNav.querySelector(`a[href="#${active.id}"]`)?.classList.add("active");
	};

	if (tocScrollHandler) {
		window.removeEventListener("scroll", tocScrollHandler);
	}
	tocScrollHandler = setActive;
	window.addEventListener("scroll", tocScrollHandler, { passive: true });
	setActive();
}

function initDocsLayout(): void {
	initMobileSidebar();
	initThemeToggle();
	initToc();
	restoreSidebarScroll();
}

initSidebarScrollPersistence();
document.addEventListener("astro:page-load", initDocsLayout);
initDocsLayout();
