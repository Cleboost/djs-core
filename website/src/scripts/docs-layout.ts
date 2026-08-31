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

let tocCleanup: (() => void) | null = null;

const TOC_ACTIVATION_OFFSET = 112;
const TOC_TOP_THRESHOLD = 64;
const TOC_BOTTOM_THRESHOLD = 48;

function getHeadingTop(heading: HTMLElement): number {
	return heading.getBoundingClientRect().top + window.scrollY;
}

function initToc(): void {
	const prose = document.getElementById("prose");
	const tocNav = document.getElementById("toc-nav");
	const tocAside = document.getElementById("toc-aside");
	if (!prose || !tocNav || !tocAside) return;

	tocCleanup?.();
	tocNav.innerHTML = "";

	const headings = Array.from(
		prose.querySelectorAll("h2, h3"),
	) as HTMLElement[];

	if (headings.length === 0) {
		tocAside.style.display = "none";
		return;
	}

	tocAside.style.display = "";
	headings.forEach((heading) => {
		if (!heading.id) {
			heading.id = heading.textContent
				?.toLowerCase()
				.replace(/\s+/g, "-")
				.replace(/[^\w-]/g, "");
		}
		const link = document.createElement("a");
		link.href = `#${heading.id}`;
		link.textContent = heading.textContent!;
		link.className = `toc-link${heading.tagName === "H3" ? " toc-link-h3" : ""}`;
		tocNav.appendChild(link);
	});

	const links = Array.from(
		tocNav.querySelectorAll(".toc-link"),
	) as HTMLAnchorElement[];

	const indicator = document.createElement("div");
	indicator.className = "toc-indicator";
	indicator.setAttribute("aria-hidden", "true");
	tocNav.prepend(indicator);

	let activeId: string | null = null;

	const moveIndicator = (link: HTMLAnchorElement) => {
		indicator.style.height = `${link.offsetHeight}px`;
		indicator.style.transform = `translateY(${link.offsetTop}px)`;
	};

	const setActive = (heading: HTMLElement) => {
		if (activeId !== heading.id) {
			activeId = heading.id;
			links.forEach((link) => {
				link.classList.toggle("active", link.hash === `#${heading.id}`);
			});
		}

		const activeLink = tocNav.querySelector(
			`a[href="#${heading.id}"]`,
		) as HTMLAnchorElement | null;
		if (activeLink) moveIndicator(activeLink);
	};

	const resolveActiveHeading = (): HTMLElement => {
		const scrollY = window.scrollY;
		const maxScroll =
			document.documentElement.scrollHeight - window.innerHeight;

		if (scrollY <= TOC_TOP_THRESHOLD) {
			return headings[0];
		}

		if (maxScroll - scrollY <= TOC_BOTTOM_THRESHOLD) {
			return headings[headings.length - 1];
		}

		const activationLine = scrollY + TOC_ACTIVATION_OFFSET;
		let active = headings[0];

		for (const heading of headings) {
			if (getHeadingTop(heading) <= activationLine) {
				active = heading;
				continue;
			}
			break;
		}

		return active;
	};

	const updateActive = () => {
		setActive(resolveActiveHeading());
	};

	let ticking = false;
	const onScrollOrResize = () => {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(() => {
			updateActive();
			ticking = false;
		});
	};

	window.addEventListener("scroll", onScrollOrResize, { passive: true });
	window.addEventListener("resize", onScrollOrResize, { passive: true });
	tocCleanup = () => {
		window.removeEventListener("scroll", onScrollOrResize);
		window.removeEventListener("resize", onScrollOrResize);
	};

	updateActive();
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
