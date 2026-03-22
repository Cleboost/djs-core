---
"@djs-core/dev": minor
---

Add non-interactive build flags to the `djs-core` development CLI:

- `--bundled` to force a Bun bundled build
- `--external` to force a Bun build with external dependencies
- reuses existing `--compile` flag to build a native binary

These flags allow CI/build-runner workflows to run `djs-core build` without an interactive prompt.

