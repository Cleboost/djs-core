---
title: Mentionable Select Menus
icon: "at"
description: Learn how to create and use mentionable select menu components with djs-core.
---

Mentionable select menus allow users to select one or more Discord users or roles from the server. They combine the functionality of user and role select menus into a single component.

<Note>
Mentionable select menus are flexible - users can select either users OR roles (or both) in a single menu. Perfect when you need flexibility in what can be selected.
</Note>

## Creating a Mentionable Select Menu

Mentionable select menus in djs-core are created using the `MentionableSelectMenu` class. Each select menu component file in `src/components/selects/mentionable/` is automatically registered.

### Basic Mentionable Select Menu

```typescript
import { MentionableSelectMenu } from "@djs-core/runtime";

export default new MentionableSelectMenu()
        .setPlaceholder("Select a user or role")
        .run(async (interaction) => {
                const selectedUser = interaction.users.first();
                const selectedRole = interaction.roles.first();

                if (selectedUser) {
                        await interaction.reply(`You selected user: ${selectedUser.username}`);
                } else if (selectedRole) {
                        await interaction.reply(`You selected role: ${selectedRole.name}`);
                }
        });
```

## Accessing Selected Items

You can access both users and roles from the interaction:

```typescript
import { MentionableSelectMenu } from "@djs-core/runtime";

export default new MentionableSelectMenu()
        .setPlaceholder("Select users or roles to tag")
        .run(async (interaction) => {
                const userMentions = interaction.users.map((u) => u.toString()).join(" ");
                const roleMentions = interaction.roles.map((r) => r.toString()).join(" ");

                let message = "";
                if (userMentions) message += `Users: ${userMentions}\n`;
                if (roleMentions) message += `Roles: ${roleMentions}`;

                await interaction.reply(message || "Nothing selected");
        });
```

## Mentionable Select Menu Data

Mentionable select menus can receive custom data using `.setData()`.

### Component Definition

```typescript [src/components/selects/mentionable/notify.ts]
import { MentionableSelectMenu } from "@djs-core/runtime";

export default new MentionableSelectMenu<{ action: string }>()
        .setPlaceholder("Select users or roles to notify")
        .run(async (interaction, data) => {
                const users = interaction.users.map((u) => u.username);
                const roles = interaction.roles.map((r) => r.name);

                await interaction.reply(
                        `Performing ${data.action} for users: ${users.join(", ") || "none"} and roles: ${roles.join(", ") || "none"}`,
                );
        });
```

### Using Select Menu with Data

```typescript
notifySelect.setData({ action: "send_notification" })
```
