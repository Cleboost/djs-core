# Documentation project instructions for djs-core

## About this project

- This is the official documentation for `djs-core`, a Discord.js framework.
- Built with [Mintlify](https://mintlify.com).
- Configuration lives in `docs.json`.

## Terminology

- **Command**: A slash command, user command, or message command.
- **Component**: A button, select menu, or modal.
- **Plugin**: A reusable module that extends the framework.
- **Task**: A scheduled background job (cron).
- **Handler**: Internal logic that processes interactions and events.

## Style preferences

- Use **Bun** as the primary example for commands (e.g., `bun djs-core dev`).
- Always show code snippets using TypeScript.
- Refer to `discord.js` when discussing underlying Discord functionality.
- Bold for CLI commands: Run `bun djs-core dev`.

## Content boundaries

- Focus on `djs-core` abstractions, not deep `discord.js` internals unless necessary.
- Documentation should be accessible to both beginners and advanced Discord bot developers.
