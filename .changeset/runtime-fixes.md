---
"@djs-core/runtime": patch
---

Reliability and performance improvements:

  - Catch event listener failures in `EventHandler` instead of crashing the process
  - Close database, DataStore, and cron jobs in `DjsClient.destroy()`
  - Route slash command sync through `ApplicationCommandHandler` only (no duplicate compiler path)
  - Cap autocomplete responses at 25 choices with a warning when trimmed
  - Cache SQLite prepared statements in `DataStore` for store/get/delete/cleanup
  - Default to Guilds intent with bounded message cache and thread sweepers via `Options.createDefault`; opt into extra intents and partials from `djs.config.ts`
