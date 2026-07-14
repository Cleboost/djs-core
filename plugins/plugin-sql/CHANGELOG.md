# @djs-core/plugin-sql

## 2.0.3

### Patch Changes

- Updated dependencies [b4d86c3]
- Updated dependencies [ea05cf9]
  - @djs-core/runtime@1.13.1

## 2.0.2

### Patch Changes

- Updated dependencies [387494a]
  - @djs-core/runtime@1.13.0

## 2.0.1

### Patch Changes

- Updated dependencies [1313559]
- Updated dependencies [fe6bbc7]
- Updated dependencies [9cbd5e7]
  - @djs-core/runtime@1.12.0

## 2.0.0

### Major Changes

- fa07901: Enforce tagged template literals for SQL queries to prevent SQL injection by design.
  This is a breaking change that removes support for traditional `(query, params)` syntax in favor of safe-by-default backtick templates: `` sql.execute`SELECT...`  ``.

### Patch Changes

- 9bf091e: Migrate to the new decoupled type generation system for improved developer experience and better type safety.
- Updated dependencies [9bf091e]
- Updated dependencies [3c13aa6]
- Updated dependencies [d8a5f1f]
  - @djs-core/runtime@1.8.0

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
