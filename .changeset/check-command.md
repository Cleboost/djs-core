---
"@djs-core/dev": minor
---

Add `djs-core check` command — a static linter for djs-core anti-patterns powered by ts-morph.

- `--fix` auto-applies all fixable issues
- `--rule <name>` runs a single rule
- Errors exit with code 1, warnings are informational only

Built-in rules:
- **no-ephemeral** (error, fixable): replaces deprecated `ephemeral: true` with `flags: [MessageFlags.Ephemeral]` and adds the import automatically
- **prefer-typed-options** (warn): suggests using the typed `options` parameter in `.run()` instead of `interaction.options.getXxx()`
