# @djs-core/plugin-sql

## 1.0.0

### Major Changes

- c7d6460: - **plugin-sql**: Initial release of the SQL plugin using Bun SQLite.
  - **runtime**:
    - Improve `Command` class type support for fluent API with subcommands and groups.
    - Ensure plugins are fully initialized before bot startup to prevent race conditions.
  - **dev**:
    - Stabilize type generation in monorepo by adding local `tsconfig.json` support and `bundler` module resolution.
    - Wait for plugin initialization in the generated production entry point.
  - **example**: Added a comprehensive SQL Todo List example using filesystem-based subcommands.

### Patch Changes

- Updated dependencies [c7d6460]
- Updated dependencies [b5594d9]
- Updated dependencies [d5ab9f8]
  - @djs-core/runtime@1.7.0
