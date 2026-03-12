---
title: "Plugins"
icon: "plug"
description: "Extend your bot with the powerful djs-core plugin system."
---

Plugins are reusable modules that can add features, commands, or data stores to your bot. They allow you to share logic between multiple bot projects.

## Using a Plugin

To use a plugin, add it to your `djs.config.ts`. You can also provide specific configuration for the plugin.

```typescript [djs.config.ts]
import { myAwesomePlugin } from "my-awesome-djs-plugin";

export default defineConfig({
  // ...
  plugins: [myAwesomePlugin],
  pluginsConfig: {
    myAwesome: {
      apiKey: "secret",
    },
  },
});
```

## Creating a Plugin

You can create your own plugins by using the `definePlugin` helper from `@djs-core/runtime`.

```typescript [my-plugin.ts]
import { definePlugin } from "@djs-core/runtime";

export const myPlugin = definePlugin({
  name: "myPlugin",
  setup: (client, config) => {
    // initialize your plugin
    // return an extension object that will be attached to interaction.client.myPlugin
    return {
      sayHello: () => "Hello from plugin!",
    };
  },
  onReady: (client, config, extension) => {
    // code to run when the bot is ready
    console.log("Plugin is ready!");
  }
});
```

### Plugin Lifecycle Hooks

- **`setup(client, config)`**: Called when the bot starts, before it logs into Discord. Returns an optional extension object.
- **`onReady(client, config, extension)`**: Called after the bot is fully ready.

## Why use plugins?

- **Reusability**: Share common logic (e.g., database handling, logging) across multiple bots.
- **Modularity**: Keep your core bot code clean by offloading specific features to plugins.
- **Type Safety**: When using `defineConfig`, plugins and their configurations are fully typed.
