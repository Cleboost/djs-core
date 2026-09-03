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

export const tabs: NavTab[] = [{ label: "Guides", slug: "" }];

export const nav: NavGroup[] = [
	{
		label: "Getting Started",
		items: [
			{ label: "djs-core", slug: "", icon: "house" },
			{
				label: "Installation",
				slug: "getting-started/installation",
				icon: "download",
			},
			{
				label: "Project Structure",
				slug: "getting-started/project-structure",
				icon: "folder-tree",
			},
			{
				label: "Routing",
				slug: "guides/routing",
				icon: "route",
			},
			{
				label: "Configuration",
				slug: "essentials/configuration",
				icon: "gear",
			},
		],
	},
	{
		label: "Interactions",
		items: [
			{ label: "Overview", slug: "interaction", icon: "message" },
			{ label: "Commands", slug: "interaction/commands", icon: "terminal" },
			{
				label: "Context Menus",
				slug: "interaction/context-menus",
				icon: "mouse-pointer",
			},
			{
				label: "Event Listeners",
				slug: "interaction/events",
				icon: "bolt",
			},
		],
	},
	{
		label: "Components",
		items: [
			{ label: "Overview", slug: "components", icon: "puzzle-piece" },
			{ label: "Buttons", slug: "components/buttons", icon: "square" },
			{ label: "Modals", slug: "components/modals", icon: "window-maximize" },
			{
				label: "Select Menus",
				slug: "components/select-menus",
				icon: "list",
			},
		],
	},
	{
		label: "Data",
		items: [
			{ label: "Database", slug: "essentials/database", icon: "database" },
			{
				label: "Migrate from plugins",
				slug: "guides/migrate-db-plugins",
				icon: "arrow-right-arrow-left",
			},
		],
	},
	{
		label: "Production",
		items: [{ label: "Bundle", slug: "bundle", icon: "box-open" }],
	},
	{
		label: "Extensions",
		items: [
			{ label: "Plugins", slug: "essentials/plugins", icon: "plug" },
			{
				label: "Plugin Marketplace",
				slug: "plugins-marketplace",
				icon: "sparkles",
			},
		],
	},
	{
		label: "Experimental",
		items: [
			{
				label: "Cron Tasks",
				slug: "essentials/cron-tasks",
				icon: "calendar-check",
			},
			{
				label: "User Config",
				slug: "essentials/user-config",
				icon: "file-code",
			},
		],
	},
	{
		label: "Tooling",
		items: [
			{ label: "CLI Reference", slug: "guides/cli", icon: "terminal" },
			{ label: "Lint", slug: "essentials/check", icon: "magnifying-glass" },
			{ label: "Testing", slug: "essentials/testing", icon: "flask" },
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
	if (slug === "plugins-marketplace") return "";
	return "";
}

export function showGuidesSidebar(slug: string): boolean {
	return slug !== "plugins-marketplace" && slug !== "partners";
}
