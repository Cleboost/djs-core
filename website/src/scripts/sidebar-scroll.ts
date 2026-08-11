const SCROLL_KEY = "djs-sidebar-scroll";

function isInternalLink(anchor: HTMLAnchorElement): boolean {
	if (anchor.target === "_blank") return false;
	const url = new URL(anchor.href, window.location.href);
	return url.origin === window.location.origin;
}

export function saveSidebarScroll(): void {
	const sidebar = document.getElementById("sidebar");
	if (!sidebar) return;
	sessionStorage.setItem(SCROLL_KEY, String(sidebar.scrollTop));
}

export function restoreSidebarScroll(): void {
	const sidebar = document.getElementById("sidebar");
	const raw = sessionStorage.getItem(SCROLL_KEY);
	if (!sidebar || raw === null) return;
	sidebar.scrollTop = Number(raw);
}

export function initSidebarScrollPersistence(): void {
	document.addEventListener(
		"click",
		(event) => {
			const anchor = (event.target as Element).closest("a[href]");
			if (!(anchor instanceof HTMLAnchorElement)) return;
			if (!isInternalLink(anchor)) return;
			saveSidebarScroll();
		},
		true,
	);

	document.addEventListener("astro:page-load", restoreSidebarScroll);
	restoreSidebarScroll();
}
