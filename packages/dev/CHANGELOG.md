# @djs-core/dev

## 5.4.1

### Patch Changes

- Updated dependencies [b4d86c3]
- Updated dependencies [ea05cf9]
  - @djs-core/runtime@1.13.1

## 5.4.0

### Minor Changes

- ee21ee9: Add `require-description` lint rule to `djs-core check`.

  Warns when a `Command` is missing `.setDescription()` — Discord requires a description for all slash commands. The rule is fixable: `--fix` inserts `.setDescription("TODO: add a description")` automatically.

- 387494a: Add `.withData<T>()` method to Button, Modal, and all SelectMenu components

  - `Button`, `Modal`, `StringSelectMenu`, `UserSelectMenu`, `RoleSelectMenu`, `ChannelSelectMenu`, and `MentionableSelectMenu` now expose `.withData<T>()` to declare the expected data type
  - The old generic constructor syntax (`new Button<T>()`) is deprecated in favor of `new Button().withData<T>()`
  - New `no-generic-constructor` lint rule in `djs-core check` detects and autofixes the deprecated pattern

### Patch Changes

- Updated dependencies [387494a]
  - @djs-core/runtime@1.13.0

## 5.3.0

### Minor Changes

- 7e6922e: Add `djs-core check` command — a static linter for djs-core anti-patterns powered by ts-morph.

  - `--fix` auto-applies all fixable issues
  - `--rule <name>` runs a single rule
  - Errors exit with code 1, warnings are informational only

  Built-in rules:

  - **no-ephemeral** (error, fixable): replaces deprecated `ephemeral: true` with `flags: [MessageFlags.Ephemeral]` and adds the import automatically
  - **prefer-typed-options** (warn): suggests using the typed `options` parameter in `.run()` instead of `interaction.options.getXxx()`

- ff8a9f6: Add `djs-core generate` command (alias `g`) to scaffold interaction files from templates.

  Supported types: `command`, `button`, `modal`, `select`, `event`, `context`.

  ```sh
  djs-core generate command shop/search
  djs-core g button confirm
  djs-core g modal feedback --force
  ```

  Creates the file at the correct path with the right imports and a working skeleton. Intermediate directories are created automatically.

- 778aa24: Add `djs-core list` command that scans `src/` and prints all detected commands, context menus, buttons, select menus, modals, events and cron tasks with their routes and file paths.

### Patch Changes

- Updated dependencies [1313559]
- Updated dependencies [fe6bbc7]
- Updated dependencies [9cbd5e7]
  - @djs-core/runtime@1.12.0

## 5.2.3

### Patch Changes

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

- e136a99: Add bundle option handling to the build command and improve generated entry safety.

  This change updates the build flow to support bundling user config at build time,
  copies `config.json` to the output when appropriate, and tightens runtime
  assertions in the generated entry file.

- 1d52c96: Refactor dev tooling internals and fix several bugs.

  - Replace 6 near-identical `scan*` functions with a single generic `scanDir<T>`, reducing ~300 lines of duplication
  - Extract shared plugin resolution logic into `utils/plugin.ts`
  - Fix `-p/--path` option not capturing its value in the `dev` command
  - Remove unnecessary `usePolling` from chokidar (caused 300ms delay on Linux)
  - Fix confusing TDZ error when `djs.config.ts` fails to load (e.g. missing TOKEN)

- Updated dependencies [96bc0d0]
  - @djs-core/runtime@1.11.0

## 5.2.2

### Patch Changes

- Updated dependencies [1aab71f]
  - @djs-core/runtime@1.10.0

## 5.2.1

### Patch Changes

- Updated dependencies [07c0dd9]
  - @djs-core/runtime@1.9.0

## 5.2.0

### Minor Changes

- 9bf091e: New plugin management system with `djs-core plugin install` and `postinstall` commands. Supports automatic configuration updates and plugin-contributed CLI commands.
- 32395b2: Add non-interactive build flags to the `djs-core` development CLI:

  - `--bundled` to force a Bun bundled build
  - `--external` to force a Bun build with external dependencies
  - reuses existing `--compile` flag to build a native binary

  These flags allow CI/build-runner workflows to run `djs-core build` without an interactive prompt.

### Patch Changes

- Updated dependencies [9bf091e]
- Updated dependencies [3c13aa6]
- Updated dependencies [d8a5f1f]
  - @djs-core/runtime@1.8.0

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
