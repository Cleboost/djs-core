import type { DjsCorePlugin } from "djs-core";

export function SuperDemoPlugin(): DjsCorePlugin {
  return {
    name: "super-demo",
    async setupClient(client) {
      (client as any).superDemo = "Hello from the super simple plugin !";
      console.log("✅ Plugin super-demo loaded in the client !");
    },
    extendTypes() {
      return `
declare module "discord.js" {
  interface Client {
    superDemo: string;
  }
}
`;
    },
  };
}

export default SuperDemoPlugin;