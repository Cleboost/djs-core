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

**Extensible, moving toward native features.** Database (Drizzle) is now built into the core — `client.db`, `db/` at the project root, and `djs-core db` CLI. Official plugins like `@djs-core/plugin-drizzle` are deprecated. Third-party plugins via `definePlugin` still work; we may eventually drop maintenance of official plugins as native equivalents land.

**Built for the long run.** djs-core includes a built-in linter (`djs-core check`) that catches deprecated patterns before they cause issues, and a scaffolding tool (`djs-core generate`) that creates files the right way every time.

## What it handles

- Slash commands, context menus, autocomplete
- Buttons, modals, all select menu variants
- Events and scheduled tasks (cron)
- Subcommand groups via folder structure
- Per-option typed autocomplete handlers
- **Native Drizzle database** — `db:` in config, `interaction.client.db`, migrations via `djs-core db`
- Plugin system with lifecycle hooks (third-party extensions)
- Static analysis with auto-fix

## Packages

| Package | Description |
|---|---|
| `@djs-core/runtime` | Core runtime — loads and runs your bot |
| `@djs-core/dev` | CLI — `build`, `dev`, `check`, `generate`, `db` |
| `@djs-core/db` | Drizzle layer (used by runtime; install is transitive) |

**Deprecated official plugins** (still in repo for migration, no longer recommended):

| Package | Status |
|---|---|
| `@djs-core/plugin-drizzle` | Use native `db:` + `client.db` instead |
| `@djs-core/plugin-prisma-sqlite` | May be replaced by native DB later |
| `@djs-core/plugin-sql` | Legacy; native alternatives planned |

Long term, djs-core aims to ship common features (database, tooling, etc.) as core packages rather than optional official plugins. Community plugins using `definePlugin` are not affected.

### Database (quick start)

```ts
// djs.config.ts
export default defineConfig({
  token: process.env.TOKEN!,
  servers: ["..."],
  db: { dialect: "sqlite", autoMigrate: true },
});
```

```ts
// in a command handler
import { Command } from "@djs-core/runtime";
import { eq, schema } from "@djs-core/db";

await interaction.client.db
  .select()
  .from(schema.todos)
  .where(eq(schema.todos.id, id));
```

Schema lives in `db/schema.ts`. CLI: `djs-core db init | generate | migrate`. Drizzle Kit config is synced from `djs.config.ts` — no duplicate dialect in `drizzle.config.ts`.

## Documentation

Full documentation is available at **[djs-core.cleboost.com](https://djs-core.cleboost.com)**.

---

<div align="center">
  <sub>MIT License · Made by <a href="https://github.com/Cleboost">Cleboost</a></sub>
</div>
