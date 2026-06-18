// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
	site: "https://cleboost.github.io",
	base: "/djs-core",
	integrations: [
		starlight({
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
						{ label: "Introduction", slug: "index" },
						{ label: "Installation", slug: "getting-started/installation" },
						{ label: "Project Structure", slug: "getting-started/project-structure" },
					],
				},
				{
					label: "Interactions",
					items: [
						{ label: "Overview", slug: "interaction" },
						{ label: "Commands", slug: "interaction/commands" },
						{ label: "Context Menus", slug: "interaction/context-menus" },
						{ label: "Events", slug: "interaction/events" },
					],
				},
				{
					label: "Components",
					items: [
						{ label: "Overview", slug: "components" },
						{ label: "Buttons", slug: "components/buttons" },
						{ label: "Modals", slug: "components/modals" },
						{ label: "String Select Menus", slug: "components/string-select-menus" },
						{ label: "User Select Menus", slug: "components/user-select-menus" },
						{ label: "Role Select Menus", slug: "components/role-select-menus" },
						{ label: "Channel Select Menus", slug: "components/channel-select-menus" },
						{ label: "Mentionable Select Menus", slug: "components/mentionable-select-menus" },
					],
				},
				{
					label: "Essentials",
					items: [
						{ label: "Plugins", slug: "essentials/plugins" },
						{ label: "Events & Tasks", slug: "essentials/events-tasks" },
						{ label: "Configuration", slug: "essentials/configuration" },
					],
				},
				{
					label: "Bundle",
					items: [{ label: "Bundle", slug: "bundle" }],
				},
				{
					label: "AI Tools",
					items: [
						{ label: "Cursor", slug: "ai-tools/cursor" },
						{ label: "Claude Code", slug: "ai-tools/claude-code" },
						{ label: "Windsurf", slug: "ai-tools/windsurf" },
					],
				},
			],
		}),
	],
});
