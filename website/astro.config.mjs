// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://djs-core.cleboost.com",
	base: "/",
	integrations: [
		starlight({
			components: {
				Sidebar: "./src/components/Sidebar.astro",
			},
			title: "djs-core",
			description: "A Discord.js bot framework for building scalable bots.",
			logo: {
				light: "./src/assets/logo-light.svg",
				dark: "./src/assets/logo-dark.svg",
				replacesTitle: true,
			},
			favicon: "/favicon.svg",
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/Cleboost/djs-core",
				},
			],
			customCss: ["./src/styles/custom.css"],
			sidebar: [
				{
					label: "Getting Started",
					items: [
						{ label: "Introduction", slug: "index", attrs: { "data-icon": "rocket" } },
						{ label: "Installation", slug: "getting-started/installation", attrs: { "data-icon": "download" } },
						{ label: "Project Structure", slug: "getting-started/project-structure", attrs: { "data-icon": "laptop" } },
					],
				},
				{
					label: "Interactions",
					items: [
						{ label: "Overview", slug: "interaction", attrs: { "data-icon": "list-format" } },
						{ label: "Commands", slug: "interaction/commands", attrs: { "data-icon": "comment" } },
						{ label: "Context Menus", slug: "interaction/context-menus", attrs: { "data-icon": "bars" } },
						{ label: "Events", slug: "interaction/events", attrs: { "data-icon": "star" } },
					],
				},
				{
					label: "Components",
					items: [
						{ label: "Overview", slug: "components", attrs: { "data-icon": "open-book" } },
						{ label: "Buttons", slug: "components/buttons", attrs: { "data-icon": "approve-check-circle" } },
						{ label: "Modals", slug: "components/modals", attrs: { "data-icon": "window" } },
						{ label: "String Select Menus", slug: "components/string-select-menus", attrs: { "data-icon": "down-caret" } },
						{ label: "User Select Menus", slug: "components/user-select-menus", attrs: { "data-icon": "heart" } },
						{ label: "Role Select Menus", slug: "components/role-select-menus", attrs: { "data-icon": "padlock" } },
						{ label: "Channel Select Menus", slug: "components/channel-select-menus", attrs: { "data-icon": "discord" } },
						{ label: "Mentionable Select Menus", slug: "components/mentionable-select-menus", attrs: { "data-icon": "comment-alt" } },
					],
				},
				{
					label: "Essentials",
					items: [
						{ label: "Plugins", slug: "essentials/plugins", attrs: { "data-icon": "puzzle" } },
						{ label: "Events & Tasks", slug: "essentials/events-tasks", attrs: { "data-icon": "clock" } },
						{ label: "Configuration", slug: "essentials/configuration", attrs: { "data-icon": "setting" } },
					],
				},
				{
					label: "Bundle",
					items: [{ label: "Bundle", slug: "bundle", attrs: { "data-icon": "document" } }],
				},
			],
		}),
	],
});
