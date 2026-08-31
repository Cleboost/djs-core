# @djs-core/runtime

## 1.14.0

### Minor Changes

- Add native `@djs-core/db` with `client.db`, `db:` config, and `djs-core db` CLI.

  - New `@djs-core/db` package — Drizzle layer with sqlite, postgresql, mysql, and turso dialects
  - `db:` block in `djs.config.ts` with optional `autoMigrate`
  - `interaction.client.db` typed via `.djscore/db.d.ts`
  - CLI: `djs-core db init | generate | migrate | push | studio | pull`
  - Drizzle Kit config synced from `djs.config.ts` without loading secrets
  - DB code tree-shaken from bundle when `db:` is not configured
  - Official database plugins deprecated in favor of native DB

- 032b767: Add a scoped colored logger shared by the runtime and dev CLI.

  - New `HH:MM [SCOPE]` log format with levels (`debug`, `info`, `success`, `warn`, `error`) and TTY-aware colors
  - Export `createLogger`, `runtimeLog`, `devLog`, `pluginLog`, and related types from `@djs-core/runtime`
  - Replace ad-hoc `console.log` / `picocolors` usage across runtime handlers and dev commands with the unified logger
  - Add `warnBlock()` for multi-line warnings such as permission mismatches during command sync

- 3b69980: Replace `dts-bundle-generator` with `tsc` for faster, more reliable type emits in runtime and dev.

  - Export `Config` from `@djs-core/runtime` so published declarations stay self-contained
  - Export plugin helpers: `resolvePlugin`, `RUNTIME_PACKAGE_NAME`, `RUNTIME_VERSION`, and `validatePluginRuntime`
  - Add runtime semver validation against a plugin's `peerDependencies["@djs-core/runtime"]` at load time

### Patch Changes

- 4a24ff1: Collapse dev startup load logs into a compact summary.

  - Replace per-file load lines with a single summary showing counts for commands, buttons, modals, select menus, context menus, events, crons, and tasks
  - Add `loadSummary()` on the shared logger for grouped startup output

- 3e06307: Decouple `@djs-core/dev` from automatic runtime patch bumps.

  - Move `@djs-core/runtime` from dev `dependencies` to `peerDependencies` (`^1.13.0`)
  - Add `PLUGIN_API_CHANGELOG.md` to track plugin API changes separately from runtime bugfixes
  - Remove the internal `PLUGIN_CONTRACT.md` in favor of the dedicated plugin API changelog

- Updated dependencies
  - @djs-core/db@1.0.0

## 1.13.1

### Patch Changes

- b4d86c3: Bump `discord.js` peer dependency from 14.26.4 to 14.26.5.
- ea05cf9: Fix `default_member_permissions` not being applied when commands are nested under subcommand groups (e.g. `admin.logs.export`). Permissions from leaf commands are now merged onto the root slash command during sync.

  Add a console warning when subcommands under the same root command define different `default_member_permissions`, since Discord only supports one permission set per root command.

## 1.13.0

### Minor Changes

- 387494a: Add `.withData<T>()` method to Button, Modal, and all SelectMenu components

  - `Button`, `Modal`, `StringSelectMenu`, `UserSelectMenu`, `RoleSelectMenu`, `ChannelSelectMenu`, and `MentionableSelectMenu` now expose `.withData<T>()` to declare the expected data type
  - The old generic constructor syntax (`new Button<T>()`) is deprecated in favor of `new Button().withData<T>()`
  - New `no-generic-constructor` lint rule in `djs-core check` detects and autofixes the deprecated pattern

## 1.12.0

### Minor Changes

- 1313559: Add `.autocomplete(optionName, fn)` helper on `Command` for per-option autocomplete handlers. The function receives `(value, interaction)` and returns choices directly — no need to call `getFocused()` or `respond()` manually. Multiple options are supported by chaining. `.runAutocomplete()` remains available as a low-level fallback and is called when no per-option handler matches.
- 9cbd5e7: Add automatic TypeScript inference for command options in `.run()`. Option names and required status are inferred from the builder chain — no manual typing needed.

  ```ts
  new Command()
    .addStringOption((opt) => opt.setName("fruit").setRequired(true))
    .addStringOption((opt) => opt.setName("color"))
    .run(async (interaction, options) => {
      options.fruit; // string
      options.color; // string | null
    });
  ```

### Patch Changes

- fe6bbc7: Refactor ButtonHandler, ModalHandler, and SelectMenuHandler to extend a shared `BaseHandler` abstract class, eliminating ~90 lines of duplicated Map/dispatch logic.

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
