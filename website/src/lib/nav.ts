export interface NavItem {
	label: string;
	slug: string;
	icon?: string;
}

export interface NavGroup {
	label: string;
	items: NavItem[];
}

export const nav: NavGroup[] = [
	{
		label: "Getting Started",
		items: [
			{ label: "Introduction", slug: "", icon: "rocket" },
			{ label: "Installation", slug: "getting-started/installation", icon: "download" },
			{ label: "Project Structure", slug: "getting-started/project-structure", icon: "folder" },
		],
	},
	{
		label: "Interactions",
		items: [
			{ label: "Commands", slug: "interaction/commands", icon: "terminal" },
			{ label: "Context Menus", slug: "interaction/context-menus", icon: "mouse" },
			{ label: "Events", slug: "interaction/events", icon: "zap" },
		],
	},
	{
		label: "Components",
		items: [
			{ label: "Buttons", slug: "components/buttons", icon: "square" },
			{ label: "Modals", slug: "components/modals", icon: "layout" },
			{ label: "String Select Menus", slug: "components/string-select-menus", icon: "chevron-down" },
			{ label: "User Select Menus", slug: "components/user-select-menus", icon: "user" },
			{ label: "Role Select Menus", slug: "components/role-select-menus", icon: "shield" },
			{ label: "Channel Select Menus", slug: "components/channel-select-menus", icon: "hash" },
			{ label: "Mentionable Select Menus", slug: "components/mentionable-select-menus", icon: "at-sign" },
		],
	},
	{
		label: "Essentials",
		items: [
			{ label: "Plugins", slug: "essentials/plugins", icon: "puzzle" },
			{ label: "Cron Tasks", slug: "essentials/events-tasks", icon: "clock" },
			{ label: "Configuration", slug: "essentials/configuration", icon: "settings" },
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
