import { definePlugin } from "@djs-core/runtime";
import packageJson from "./package.json" with { type: "json" };

export interface DemoConfig {
	message: string;
}

export const demoPlugin = definePlugin({
	name: "demo",
	packageName: packageJson.name,
	setup: (_client, config: DemoConfig) => {
		return {
			sayHello: () => {
				console.log(`[Demo Plugin] ${config.message}`);
				return `Hello: ${config.message}`;
			},
		};
	},
	onReady: (_client, _config, extension) => {
		console.log("[Demo Plugin] Ready!");
		extension.sayHello();
	},
	types: () => {
		return `declare module "@djs-core/runtime" {
  interface PluginsExtensions {
    demo: {
      sayHello: () => string;
    };
  }
}
`;
	},
});
