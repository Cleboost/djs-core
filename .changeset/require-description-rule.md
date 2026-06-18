---
"@djs-core/dev": minor
---

Add `require-description` lint rule to `djs-core check`.

Warns when a `Command` is missing `.setDescription()` — Discord requires a description for all slash commands. The rule is fixable: `--fix` inserts `.setDescription("TODO: add a description")` automatically.
