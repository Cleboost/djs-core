# djs-core

**djs-core** is a lightweight TypeScript framework built on top of [discord.js](https://discord.js.org), fully compatible with **Node.js** (≥ 18, ESM) and optimized for [Bun](https://bun.sh) for top-notch performance.

Key features:

* A **CLI** to scaffold slash-commands and event listeners in seconds.
* **Development mode** with *hot-reload* and automatic slash-command deployment.
* A **build system** that bundles & minifies your bot for production (optional Docker output).
* A minimal API to declare **slash-commands** and **listeners** without boilerplate.

> ⚡️ Runs on **Bun** (≥ 1.2) **or** **Node.js** (≥ 18, ESM). Bun is recommended for faster installs and startup times, but everything works fine on standard Node.

## Table of contents

1. [Installation](#installation)  
2. [Getting started](#getting-started)  
3. [CLI reference](#cli-reference)  
4. [Configuration](#configuration)  
5. [Complete example](#complete-example)  
6. [Build & deploy](#build--deploy)  
7. [Contributing](#contributing)  
8. [License](#license)

---

## Installation

```bash
bun add djs-core discord.js
```

`discord.js` is declared as a *peer-dependency*, therefore you must install it yourself.

## Getting started

Create a fresh project:

```bash
bun init my-bot
cd my-bot
```

Add a `djsconfig.ts` file at the project root:

```ts
import { GatewayIntentBits } from "discord.js";

export default {
  token: process.env.TOKEN ?? "",      // provided via .env
  intents: [GatewayIntentBits.Guilds],  // adjust to your needs
  guildIds: ["123456789012345678"],    // optional: instant guild deployment
} as const;
```

Scaffold your first command:

```bash
bunx djs-core generate:command --name ping --description "Replies with Pong!"
```

Start the bot in development mode (*hot-reload*):

```bash
TOKEN=YourToken bunx djs-core dev
```

Type `/ping` in Discord → the bot replies « Pong! 🏓 ».

## CLI reference

| Command | Description |
|---------|-------------|
| `generate:command` | Create a slash-command skeleton inside `src/commands/`. |
| `generate:event`   | Create a Discord event listener inside `src/events/`. |
| `dev [path]`       | Launch the bot in development mode (with hot-reload). |
| `build [path]`     | Bundle the bot for production (+ `--docker` option). |

New files are automatically opened in your editor if the `EDITOR` or `VISUAL` environment variable is set.

### Example: `generate:command`

```bash
bunx djs-core generate:command -n avatar -d "Shows a user avatar"
```

```ts
import { Command } from "djs-core";

export default new Command()
  .setName("avatar")
  .setDescription("Shows a user avatar")
  .addUserOption((option) => option.setName("user").setDescription("The user to show the avatar of").setRequired(false))
  .run((_client, interaction) => {
    const user = interaction.options.getUser("user") ?? interaction.user;
    interaction.reply(user.displayAvatarURL());
  });
```

## Configuration

| File | Purpose |
|------|---------|
| `.env` | Stores secrets (Discord token, API keys…). **Ignored by Git**. |
| `.env.template` | Sample `.env` file committed to document required variables. |
| `djsconfig.ts/js` | Main bot configuration (token, intents, guildIds…). |

> **Tip:** In development mode, `djs-core` automatically loads variables from `.env` if present at the project root.

## Complete example

A ready-to-run example bot is available in [`examples/playground`](./examples/playground).

```bash
cd examples/playground
cp .env.template .env   # put your TOKEN in .env
TOKEN=YourToken bunx djs-core dev .
```

## Build & deploy

```bash
bunx djs-core build   # produces dist/ ready for Bun
```

Options:

* `--docker` – add a minimal `Dockerfile` to `dist/` (FROM `oven/bun:alpine`).

The output directory (`dist/`) contains:

* `index.js` – ES2020 minified bundle.
* `package.json` – production dependencies + `start` script.
* `Dockerfile` (if `--docker` was used).

Deploy the folder to your host of choice:

```bash
cd dist
bun install --production
bun start
```

## Contributing

PRs are welcome! To hack on the library itself:

```bash
bun install
bun run dev   # tests/linters will be added soon
```

Before opening a pull-request:

1. Ensure `bun test` (coming soon) passes.
2. Keep the documentation up-to-date.