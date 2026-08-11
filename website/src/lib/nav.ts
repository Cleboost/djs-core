export interface NavItem {
	label: string;
	slug: string;
	icon?: string;
}

export interface NavGroup {
	label: string;
	items: NavItem[];
}

export interface NavTab {
	label: string;
	slug: string;
}

export const tabs: NavTab[] = [
	{ label: "Guides", slug: "" },
	{ label: "Plugins Marketplace", slug: "plugins-marketplace" },
	{ label: "Partners", slug: "partners" },
];

export const nav: NavGroup[] = [
	{
		label: "Getting Started",
		items: [
			{ label: "Djs-Core", slug: "", icon: "house" },
			{ label: "Installation", slug: "getting-started/installation", icon: "download" },
			{ label: "Project Structure", slug: "getting-started/project-structure", icon: "folder-tree" },
		],
	},
	{
		label: "Interaction",
		items: [
			{ label: "Interactions", slug: "interaction", icon: "message" },
			{ label: "Commands", slug: "interaction/commands", icon: "terminal" },
			{ label: "Context Menus", slug: "interaction/context-menus", icon: "mouse-pointer" },
			{ label: "Event Listeners", slug: "interaction/events", icon: "clock-eleven-thirty" },
		],
	},
	{
		label: "Components",
		items: [
			{ label: "Components", slug: "components", icon: "puzzle-piece" },
			{ label: "Buttons", slug: "components/buttons", icon: "square" },
			{ label: "Modals", slug: "components/modals", icon: "window-maximize" },
			{ label: "String Select Menus", slug: "components/string-select-menus", icon: "list" },
			{ label: "User Select Menus", slug: "components/user-select-menus", icon: "users" },
			{ label: "Role Select Menus", slug: "components/role-select-menus", icon: "user-circle" },
			{ label: "Channel Select Menus", slug: "components/channel-select-menus", icon: "hashtag" },
			{ label: "Mentionable Select Menus", slug: "components/mentionable-select-menus", icon: "at" },
		],
	},
	{
		label: "Bundle",
		items: [{ label: "Bundle", slug: "bundle", icon: "box-open" }],
	},
	{
		label: "Plugins",
		items: [{ label: "Plugins", slug: "essentials/plugins", icon: "plug" }],
	},
	{
		label: "Experimtental",
		items: [{ label: "Cron Tasks", slug: "essentials/events-tasks", icon: "calendar-check" }],
	},
	{
		label: "Other",
		items: [{ label: "Configuration", slug: "essentials/configuration", icon: "gear" }],
	},
	{
		label: "AI tools",
		items: [
			{ label: "Cursor setup", slug: "ai-tools/cursor", icon: "arrow-pointer" },
			{ label: "Claude Code setup", slug: "ai-tools/claude-code", icon: "asterisk" },
			{ label: "Windsurf setup", slug: "ai-tools/windsurf", icon: "water" },
		],
	},
];

export function flatNav(): NavItem[] {
	return nav.flatMap((g) => g.items);
}

export function getPrevNext(slug: string): { prev?: NavItem; next?: NavItem } {
	const flat = flatNav();
	const idx = flat.findIndex((item) => item.slug === slug);
	return {
		prev: idx > 0 ? flat[idx - 1] : undefined,
		next: idx < flat.length - 1 ? flat[idx + 1] : undefined,
	};
}

export function getActiveTab(slug: string): string {
	if (slug === "plugins-marketplace") return "plugins-marketplace";
	if (slug === "partners") return "partners";
	return "";
}

export function showGuidesSidebar(slug: string): boolean {
	return slug !== "plugins-marketplace" && slug !== "partners";
}
