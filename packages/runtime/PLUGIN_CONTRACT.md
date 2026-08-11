# Plugin contract

Plugins depend on `@djs-core/runtime` through **npm semver**, not a separate API version.

## Declaring requirements

In the plugin `package.json`:

```json
{
  "peerDependencies": {
    "@djs-core/runtime": ">=1.0.0"
  }
}
```

Use the lowest runtime version that ships the plugin hooks your plugin uses. When the plugin contract breaks, `@djs-core/runtime` gets a **major** bump — plugins bump their peer range (e.g. `>=2.0.0`).

In `definePlugin()`, set `packageName` to the npm package name so the loader can read `peerDependencies`:

```ts
import packageJson from "./package.json" with { type: "json" };

export const myPlugin = definePlugin({
  name: "myPlugin",
  packageName: packageJson.name,
  setup: (client, config) => { ... },
});
```

## Load-time check

At bot start and in the dev CLI, the runtime reads the plugin's `peerDependencies["@djs-core/runtime"]` and compares it to the installed `@djs-core/runtime` version. If it does not satisfy the range, the plugin is **not loaded** and an error is logged.

## Contract milestones (runtime version)

Track breaking or additive plugin-contract changes in `@djs-core/runtime` CHANGELOG. Summary:

| Runtime | Plugin contract |
|---------|-----------------|
| `>=1.0.0` | Initial contract: `setup`, `onReady`, `cli`, `types`, `postinstall`. |

When you add a hook or break an existing one, document the exact runtime version here and in CHANGELOG.
