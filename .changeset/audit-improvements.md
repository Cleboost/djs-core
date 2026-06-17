---
"@djs-core/runtime": minor
"@djs-core/dev": patch
---

**Security**
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
