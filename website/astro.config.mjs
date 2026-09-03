// @ts-check
import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";

export default defineConfig({
	site: "https://djs-core.cleboost.com",
	base: "/",
	redirects: {
		"/components/string-select-menus": "/components/select-menus",
		"/components/user-select-menus": "/components/select-menus",
		"/components/role-select-menus": "/components/select-menus",
		"/components/channel-select-menus": "/components/select-menus",
		"/components/mentionable-select-menus": "/components/select-menus",
	},
	integrations: [
		expressiveCode({
			themes: ["dracula"],
			styleOverrides: {
				borderRadius: "0.6rem",
				codeFontFamily: "'JetBrains Mono', 'Fira Code', monospace",
				codeFontSize: "0.875rem",
				codeLineHeight: "1.7",
				frames: {
					editorBackground: "#13131c",
					editorBorderColor: "#252538",
					editorTabBarBackground: "#0f0f18",
					editorActiveTabBackground: "#13131c",
					editorActiveTabBorderColor: "#5865f2",
					editorTabBarBorderBottomColor: "#252538",
					editorActiveTabForeground: "#e2e2ee",
					tooltipSuccessBackground: "#5865f2",
				},
			},
			defaultProps: {
				showLineNumbers: false,
			},
		}),
		mdx(),
	],
	vite: {
		resolve: {
			alias: {
				"@components": "/src/components",
				"@layouts": "/src/layouts",
				"@lib": "/src/lib",
			},
		},
	},
});
