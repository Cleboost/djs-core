---
"@djs-core/dev": minor
"@djs-core/runtime": patch
---

Decouple `@djs-core/dev` from automatic runtime patch bumps.

- Move `@djs-core/runtime` from dev `dependencies` to `peerDependencies` (`^1.13.0`)
- Add `PLUGIN_API_CHANGELOG.md` to track plugin API changes separately from runtime bugfixes
- Remove the internal `PLUGIN_CONTRACT.md` in favor of the dedicated plugin API changelog
