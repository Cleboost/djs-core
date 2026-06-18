---
title: "Installation"
icon: "download"
description: "Get started with djs-core."
---

## From quickstart

<Steps>
  <Step title="Create github repo from template">
    Go to the [quickstart](https://github.com/here-template/Bot-Discord) repository and click on the `Use this template` button.
  </Step>
  <Step title="Install dependencies">
    ```bash
    bun install
    ```
  </Step>
  <Step title="Setup environment variables">
    Rename the `.env.example` file to `.env` and set your Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications)):

    ```shellscript
    TOKEN=your_discord_bot_token
    ```
  </Step>
  <Step title="Start your bot">
    ```bash
    bun run start
    ```
  </Step>
</Steps>

## From scratch

Set up a new djs-core project from scratch with complete control over your project structure.

<Steps>
  <Step title="Initialize your project">
    Create a new Bun project:

    ```bash
    bun init
    ```

    This creates a basic `package.json` and initializes your project structure.
  </Step>
  <Step title="Install dependencies">
    Install djs-core packages:

    ```bash
    bun i -D @djs-core/dev
    bun i @djs-core/runtime discord.js
    ```

    <Tip>
      - `@djs-core/dev` is a dev dependency providing build tools and CLI commands
      - `@djs-core/runtime` is the runtime library containing the framework logic
      - Make sure you also have `discord.js` installed: `bun i discord.js`
    </Tip>
  </Step>
  <Step title="Add scripts to package.json">
    Add the following scripts to your `package.json`:

    ```json
    {
      "scripts": {
        "dev": "djs-core dev",
        "build": "djs-core build",
        "start": "djs-core start"
      }
    }
    ```

    <ResponseField name="dev" type="script">
      Runs the bot in development mode with hot reload - automatically restarts when files change
    </ResponseField>
    <ResponseField name="build" type="script">
      Compiles TypeScript to JavaScript in the `dist/` folder for production
    </ResponseField>
    <ResponseField name="start" type="script">
      Runs the compiled bot from the `dist/` folder (use after `build`)
    </ResponseField>
  </Step>
  <Step title="Create configuration file">
    Create a `djs.config.ts` file in your project root:

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

    <ResponseField name="token" type="string">
      Your Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications)
    </ResponseField>
    <ResponseField name="servers" type="string[]">
      Array of guild (server) IDs where commands should be registered. Use an empty array `[]` for global commands (takes up to 1 hour to propagate).
    </ResponseField>
    <Warning>
      Never commit your bot token to version control! Store it in a `.env` file and add `.env` to your `.gitignore`.
    </Warning>
  </Step>
  <Step title="Setup environment variables">
    Create a `.env` file in your project root:

    ```env
    TOKEN=your_discord_bot_token_here
    ```

    Make sure to add `.env` to your `.gitignore`:

    ```gitignore
    .env
    node_modules/
    dist/
    ```
  </Step>
  <Step title="Create your first command">
    Create the directory structure and your first command at `src/interactions/commands/ping.ts`:

    ```typescript
    import { Command } from "@djs-core/runtime";
    
    export default new Command()
      .setDescription("Ping the bot")
      .run(async (interaction) => {
        await interaction.reply("Pong!");
      });
    ```

    <Tip>
      The command name is automatically derived from the file path. `src/interactions/commands/ping.ts` becomes `/ping` in Discord.
    </Tip>
  </Step>
  <Step title="Start your bot">
    Run your bot in development mode:

    ```bash
    bun run dev
    ```

    Your bot should now be online and the `/ping` command should be available in Discord!

    <Note>
      In development mode, commands are automatically registered when the bot starts. You'll see console output indicating which commands were registered.
    </Note>
  </Step>
</Steps>

## Next Steps

Now that your bot is set up, here's what to explore next:

<CardGroup cols={2}>
  <Card icon="folder-tree" href="/getting-started/project-structure" title="Project Structure">
    Learn about the directory structure and how to organize your bot's code.
  </Card>
  <Card icon="terminal" href="/interaction/commands" title="Commands">
    Create slash commands with options, autocomplete, and more advanced features.
  </Card>
  <Card icon="mouse-pointer-click" href="/interaction/context-menus" title="Context Menus">
    Add right-click commands for users and messages.
  </Card>
  <Card icon="puzzle" href="/components/index" title="Components">
    Create reusable buttons, modals, and select menus to enhance your interactions.
  </Card>
</CardGroup>