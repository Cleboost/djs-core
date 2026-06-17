# @djs-core/runtime

## 1.11.0

### Minor Changes

- 96bc0d0: **Security**

  - Remove `shell: true` from `spawnSync` calls in plugin installer (prevents RCE via crafted plugin names)

  **New APIs**

  - `closeDataStore()` — cleanly closes the SQLite database and stops the cleanup interval (useful for shutdown hooks and tests)
  - `isUnknownCommandError()` exported from `utils/discord-errors` — typed guard for Discord API error 10063

  **Bug fixes**

  - `isChatInputCommand()` replaces deprecated `isCommand()` — context menu interactions no longer incorrectly hit the slash command handler
  - `getInteractionData` now returns `{ data, expired } | null` instead of `unknown | undefined`, distinguishing expired tokens from tokens that were never stored
  - `ephemeral: true` replaced with `flags: MessageFlags.Ephemeral` in error replies
  - Duplicate `GuildIntegrations` and `GuildScheduledEvents` intents removed from defaults
  - `CoreConfig` now includes `partials` and `experimental.bundle` fields, matching the public `Config` interface

  **Performance**

  - DataStore is now lazily initialized — the database and cleanup interval only start on first use
  - `CommandHandler` resolves routes via `Map.get()` (O(1)) instead of `Array.find()` (O(n))

  **Refactoring**

  - `WithCustomId` mixin eliminates ~230 lines duplicated across 7 interaction classes
  - `buildCommandStructure` / `routesToEntries` extracted to `utils/compile-command.ts`
  - `resolvePlugin()` extracted to `utils/plugin-resolver.ts`
  - `StringSelectMenu.addOptions` no longer clones the full builder on each call

  **dev CLI**

  - SIGTERM handled alongside SIGINT for clean Docker/systemd shutdown
  - `-p, --path <path>` option now correctly captures its value
  - Silent `catch` blocks now log when `DEBUG=true`

## 1.10.0

### Minor Changes

- 1aab71f: feat: add support for partials in configuration and enable all intents by default in `DjsClient`.
  - Add `partials` to the `Config` interface.
  - Update `DjsClient` constructor to include more default intents.
  - Added default `partials` support in `DjsClient` for partial data handling.

## 1.9.0

### Minor Changes

- 07c0dd9: Allow users to specify optional `intents` in `djs.config.ts`. If not provided, it defaults to `MessageContent`, `GuildMembers`, and `GuildPresences`.

## 1.8.0

### Minor Changes

- 9bf091e: Support for dynamic plugin typing via `PluginsExtensions` augmentation and asynchronous `import()` in plugin configuration.

### Patch Changes

- 3c13aa6: Optimize application command registration by implementing parallel guild synchronization (via Promise.all) to improve performance and adding unit tests for command synchronization.
- d8a5f1f: Optimize context menu registration and deletion by parallelizing guild-specific API calls and improving internal safety checks.

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
