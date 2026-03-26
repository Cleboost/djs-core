---
"@djs-core/dev": patch
---

Add bundle option handling to the build command and improve generated entry safety.

This change updates the build flow to support bundling user config at build time,
copies `config.json` to the output when appropriate, and tightens runtime
assertions in the generated entry file.
