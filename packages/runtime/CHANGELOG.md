# @djs-core/runtime

## 1.7.0

### Minor Changes

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
- d5ab9f8: refactor: update EventListener to use Client<true> for better type safety and cleaner user code.

## 1.6.1

### Patch Changes

- 100d38b: Move @djs-core/runtime and discord.js from peerDependencies to dependencies to prevent automatic major version bumps by Changesets.

## 1.6.0

### Minor Changes

- b69f939: refactor: unify interaction data storage, centralize token management and remove deprecated DataStore aliases

### Patch Changes

- 6e18dea: feat: add comprehensive test suite (unit + E2E integration) and improve CommandHandler debug logging
- 4d96d3f: style: fix all biome linting and formatting issues and improve type safety by removing biome-ignore suppressions
- 3ff0882: fix: rename EventListner to EventListener to fix typo
- 69e4e9d: refactor: centralize route parsing logic into shared utilities
- 74da6f4: refactor: simplify select menu dispatch and optimize command option copying
- fc19372: refactor: standardize interaction error handling across all handlers

## 1.5.0

### Minor Changes

- 97b702a: Add support of client.config (managed by djs-core)

## 1.4.0

### Minor Changes

- f6d3cc1: Add `commands.defaultContext` array to define a default context for all commands (command.setContext overrides config)
- eed4cf3: Add cron tasks support. Cron tasks can be enabled in `djs.config.ts` as an experimental feature (`experimental.cron: true`). Tasks are defined in `src/cron/` using the fluent API: `new Task().cron("* * * * *").run((client) => { ... })`.

## 1.3.0

### Minor Changes

- 6111713: Add Client in .run() method for EventListner & rename eventLister --> eventListner
