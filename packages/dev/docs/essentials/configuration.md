---
title: "Configuration"
icon: "gear"
description: "Everything you need to know about configuring your djs-core bot."
---

The `djs.config.ts` file is the heart of your `djs-core` project. It defines essential settings like your Discord bot token and server IDs.

## `djs.config.ts`

Create a `djs.config.ts` file in your project root. Use the `Config` type from `@djs-core/dev` for full type safety.

```typescript
import type { Config } from "@djs-core/dev";

if (!process.env.TOKEN) {
  throw new Error("TOKEN environment variable is required");
}

export default {
  token: process.env.TOKEN,
  servers: ["YOUR_GUILD_ID"],
} satisfies Config;
```

## Options

<ResponseField name="token" type="string" required>
  Your Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications).
</ResponseField>

<ResponseField name="servers" type="string[]" required>
  Array of guild (server) IDs where commands should be registered.

  - During development, using specific server IDs ensures near-instant command updates.
  - Use an empty array `[]` for global commands (can take up to 1 hour to propagate).
</ResponseField>

<Warning>
  Never commit your bot token to version control! Store it in a `.env` file and add `.env` to your `.gitignore`.
</Warning>

## Environment Variables

We recommend using a `.env` file to manage your secrets:

```shellscript .env
TOKEN=your_discord_bot_token_here
```

Ensure your `.gitignore` includes:

```text
.env
node_modules/
dist/
```