---
"@djs-core/runtime": minor
"@djs-core/dev": patch
---

Replace `dts-bundle-generator` with `tsc` for faster, more reliable type emits in runtime and dev.

- Export `Config` from `@djs-core/runtime` so published declarations stay self-contained
- Export plugin helpers: `resolvePlugin`, `RUNTIME_PACKAGE_NAME`, `RUNTIME_VERSION`, and `validatePluginRuntime`
- Add runtime semver validation against a plugin's `peerDependencies["@djs-core/runtime"]` at load time
