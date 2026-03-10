---
"@djs-core/plugin-sql": major
"@djs-core/runtime": patch
"@djs-core/dev": patch
---

- **plugin-sql**: Initial release of the SQL plugin using Bun SQLite.
- **runtime**: 
  - Improve `Command` class type support for fluent API with subcommands and groups.
  - Ensure plugins are fully initialized before bot startup to prevent race conditions.
- **dev**:
  - Stabilize type generation in monorepo by adding local `tsconfig.json` support and `bundler` module resolution.
  - Wait for plugin initialization in the generated production entry point.
- **example**: Added a comprehensive SQL Todo List example using filesystem-based subcommands.
