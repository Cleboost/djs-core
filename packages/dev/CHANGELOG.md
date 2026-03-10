# @djs-core/dev

## 5.1.0

### Minor Changes

- 6240da1: feat: add support for native binary compilation using `bun build --compile`.
  Includes a new `--compile` (or `-c`) flag and an interactive menu option with a size warning.
- b5594d9: Introduce a major new plugin system for djs-core.
  - Modular architecture to extend the native client functions.
  - Fully typed configuration in `djs.config.ts`.
  - Automatic type augmentation for perfect DX (autocompletion on `client.pluginName`).
  - Support for life-cycle hooks like `onReady`.

### Patch Changes

- c7d6460: - **plugin-sql**: Initial release of the SQL plugin using Bun SQLite.
  - **runtime**:
    - Improve `Command` class type support for fluent API with subcommands and groups.
    - Ensure plugins are fully initialized before bot startup to prevent race conditions.
  - **dev**:
    - Stabilize type generation in monorepo by adding local `tsconfig.json` support and `bundler` module resolution.
    - Wait for plugin initialization in the generated production entry point.
  - **example**: Added a comprehensive SQL Todo List example using filesystem-based subcommands.
- 6240da1: fix: ensure build command exits cleanly after completion by forcing process exit.
- Updated dependencies [c7d6460]
- Updated dependencies [b5594d9]
- Updated dependencies [d5ab9f8]
  - @djs-core/runtime@1.7.0

## 5.0.2

### Patch Changes

- 100d38b: Move @djs-core/runtime and discord.js from peerDependencies to dependencies to prevent automatic major version bumps by Changesets.
- Updated dependencies [100d38b]
  - @djs-core/runtime@1.6.1

## 5.0.1

### Patch Changes

- 0b7dc91: Fix peerDependencies with workspace protocol for public distribution.

## 5.0.0

### Patch Changes

- 4d96d3f: style: fix all biome linting and formatting issues and improve type safety by removing biome-ignore suppressions
- 3ff0882: fix: rename EventListner to EventListener to fix typo
- Updated dependencies [6e18dea]
- Updated dependencies [4d96d3f]
- Updated dependencies [3ff0882]
- Updated dependencies [69e4e9d]
- Updated dependencies [74da6f4]
- Updated dependencies [fc19372]
- Updated dependencies [b69f939]
  - @djs-core/runtime@1.6.0

## 4.0.0

### Minor Changes

- 97b702a: Add support of client.config (managed by djs-core)

### Patch Changes

- Updated dependencies [97b702a]
  - @djs-core/runtime@1.5.0

## 3.0.0

### Minor Changes

- f6d3cc1: Add `commands.defaultContext` array to define a default context for all commands (command.setContext overrides config)
- eed4cf3: Add cron tasks support. Cron tasks can be enabled in `djs.config.ts` as an experimental feature (`experimental.cron: true`). Tasks are defined in `src/cron/` using the fluent API: `new Task().cron("* * * * *").run((client) => { ... })`.

### Patch Changes

- 909cda3: Fix source directory detecton for bundle interactions/events/components
- Updated dependencies [f6d3cc1]
- Updated dependencies [eed4cf3]
  - @djs-core/runtime@1.4.0

## 2.0.0

### Patch Changes

- 6111713: Rename eventLister --> eventListner Class
- e78846c: Fix modal reload causing multiple reloads and errors
- Updated dependencies [6111713]
  - @djs-core/runtime@1.3.0
