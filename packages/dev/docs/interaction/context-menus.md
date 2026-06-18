---
title: "Context Menus"
icon: "mouse-pointer"
description: "User and Message commands available from the Discord right-click menu."
---

Context menus allow users to interact with Discord elements (users or messages) by right-clicking on them. They provide quick access to bot functionality directly from the context.

## Creating a Context Menu

Context menus in djs-core are created using the `ContextMenu` class. Each context menu file in `src/interactions/contexts/` automatically becomes available in Discord.

### User Context Menu

A user context menu appears when right-clicking on a user.

```typescript [src/interactions/contexts/user/hi.ts]
import { ContextMenu } from "@djs-core/runtime";
import { ApplicationCommandType } from "discord.js";

export default new ContextMenu()
  .withType(ApplicationCommandType.User)
  .run(async (interaction) => {
    const user = interaction.targetUser;

    await interaction.reply({
      content: `Hello, ${user.username}!`,
    });
  });
```

### Message Context Menu

A message context menu appears when right-clicking on a message.

```typescript [src/interactions/contexts/message/like.ts]
import { ContextMenu } from "@djs-core/runtime";
import { ApplicationCommandType } from "discord.js";

export default new ContextMenu()
  .withType(ApplicationCommandType.Message)
  .run(async (interaction) => {
    const message = interaction.targetMessage;

    // Add a reaction to the message
    await message.react("👍");

    await interaction.reply({
      content: "Message liked!",
      ephemeral: true,
    });
  });
```

## Permissions

You can restrict context menus to users with specific permissions:

```typescript
import { ContextMenu } from "@djs-core/runtime";
import { ApplicationCommandType, PermissionFlagsBits } from "discord.js";

export default new ContextMenu()
  .withType(ApplicationCommandType.Message)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .run(async (interaction) => {
    await interaction.targetMessage.delete();
    await interaction.reply({
      content: "Message deleted!",
      ephemeral: true,
    });
  });
```

## DM Permission

You can control whether context menus are available in DMs:

```typescript
import { ContextMenu } from "@djs-core/runtime";
import { ApplicationCommandType } from "discord.js";

export default new ContextMenu()
  .withType(ApplicationCommandType.User)
  .setDMPermission(false) // Only available in servers
  .run(async (interaction) => {
    await interaction.reply("Server-only context menu!");
  });
```

## Type Safety

`djs-core` provides full TypeScript support for context menus. The interaction type is automatically inferred based on the menu type, giving you autocomplete and type checking.

<Tip>
  TypeScript will automatically know which properties are available based on the context menu type. For User menus, you'll have access to `targetUser` and `targetMember`. For Message menus, you'll have access to `targetMessage`.
</Tip>
