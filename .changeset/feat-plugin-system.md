---
"@djs-core/runtime": minor
"@djs-core/dev": minor
---

Introduce a major new plugin system for djs-core.
- Modular architecture to extend the native client functions.
- Fully typed configuration in `djs.config.ts`.
- Automatic type augmentation for perfect DX (autocompletion on `client.pluginName`).
- Support for life-cycle hooks like `onReady`.
