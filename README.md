![djs-core](https://socialify.git.ci/cleboost/djs-core/image?description=1&font=Inter&language=1&name=1&owner=1&stargazers=1&theme=Auto)

<div align="center">
  <p>
    <a href="https://djs-core.cleboost.com">Documentation</a> ·
    <a href="https://github.com/Cleboost/djs-core/issues">Issues</a> ·
    <a href="https://www.npmjs.com/package/@djs-core/runtime">npm</a>
  </p>
</div>

---

## What is djs-core?

djs-core is a framework built on top of [Discord.js](https://discord.js.org) that takes care of the repetitive scaffolding so you can focus on what your bot actually does.

Most Discord bots start the same way — you write a command handler, an event system, a file loader, and some boilerplate to wire everything together. You do this for every project. djs-core does it once, correctly, and gets out of your way.

## Philosophy

**File-based, not config-based.** Drop a file in the right folder and it works. No registration, no imports, no index files to update. The structure of your project *is* the structure of your bot.

**Typed by default.** Command options are inferred directly from your builder chain — the options object in your handler is fully typed without any manual effort. Your editor knows what's there and what isn't.

**Extensible through plugins.** Need a database? Add the Drizzle or Prisma plugin and it integrates cleanly into the config. Plugins follow the same conventions as the rest of the framework — no surprises.

**Built for the long run.** djs-core includes a built-in linter (`djs-core check`) that catches deprecated patterns before they cause issues, and a scaffolding tool (`djs-core generate`) that creates files the right way every time.

## What it handles

- Slash commands, context menus, autocomplete
- Buttons, modals, all select menu variants
- Events and scheduled tasks (cron)
- Subcommand groups via folder structure
- Per-option typed autocomplete handlers
- Plugin system with lifecycle hooks
- Static analysis with auto-fix

## Packages

| Package | Description |
|---|---|
| `@djs-core/runtime` | The core runtime — loads and runs your bot |
| `@djs-core/dev` | CLI tooling — `build`, `dev`, `check`, `generate` |
| `@djs-core/plugin-drizzle` | Drizzle ORM integration |
| `@djs-core/plugin-prisma-sqlite` | Prisma + SQLite integration |

## Documentation

Full documentation is available at **[djs-core.cleboost.com](https://djs-core.cleboost.com)**.

It is also bundled inside `@djs-core/dev` — available at `node_modules/@djs-core/dev/docs/` for offline access and AI agent consumption.

---

<div align="center">
  <sub>MIT License · Made by <a href="https://github.com/Cleboost">Cleboost</a></sub>
</div>
