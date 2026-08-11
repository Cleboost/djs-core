# Plugin API changelog

Changelog of the **plugin API** only (`definePlugin`, hooks, load rules).

Update this file when the plugin API changes. Not for runtime bugfixes, dependency bumps, or dev CLI changes unrelated to plugins.

Format: runtime version that shipped the change + what changed.

---

## @djs-core/runtime@1.13.1

Initial plugin API.

- `definePlugin()` required: `name`, `packageName`, `setup(client, config) → extension`
- Optional hooks: `onReady`, `cli`, `types`, `postinstall`
- Load-time check: `peerDependencies["@djs-core/runtime"]` must satisfy installed runtime (semver)
