---
title: User Select Menus
icon: "users"
description: Learn how to create and use user select menu components with djs-core.
---

User select menus allow users to select one or more Discord users from the server. They're useful for tagging users, assigning roles, or creating user-based interactions.

<Note>
Unlike string select menus that require predefined options, user select menus dynamically show all users in the server. Users can be selected directly from Discord's user picker.
</Note>

## Creating a User Select Menu

User select menus in djs-core are created using the `UserSelectMenu` class. Each select menu component file in `src/components/selects/user/` is automatically registered.

<Tip>
Use user select menus when you need users to select actual Discord users, like tagging people, assigning permissions, or choosing team members. For static options, use string select menus instead.
</Tip>

### Basic User Select Menu

```typescript
import { UserSelectMenu } from "@djs-core/runtime";

export default new UserSelectMenu()
        .setPlaceholder("Select a user")
        .run(async (interaction) => {
                const selectedUser = interaction.users.first();
                if (selectedUser) {
                        await interaction.reply(`You selected: ${selectedUser.username}`);
                }
        });
```

## Multiple User Selection

User select menus can allow users to select multiple users:

```typescript
import { UserSelectMenu } from "@djs-core/runtime";

export default new UserSelectMenu()
        .setPlaceholder("Select users")
        .setMinValues(1)
        .setMaxValues(5)
        .run(async (interaction) => {
                const selectedUsers = interaction.users.map((user) => user.username);
                await interaction.reply(`Selected users: ${selectedUsers.join(", ")}`);
        });
```

## Accessing Selected Users

The `interaction.users` collection contains all selected users. Here's what's available:

<ResponseField name="interaction.users" type="Collection">
Collection of all selected User objects - Use `.first()`, `.map()`, `.forEach()`, etc.
</ResponseField>

<ResponseField name="interaction.members" type="Collection">
Collection of GuildMember objects (only available in guilds) - Contains server-specific member data
</ResponseField>

<ResponseField name="interaction.inGuild()" type="method">
Check if the interaction happened in a server (not DMs) - Returns boolean
</ResponseField>

## User Select Menu Data

User select menus can receive custom data using `.setData()`.

### Component Definition

```typescript [src/components/selects/user/assign.ts]
import { UserSelectMenu } from "@djs-core/runtime";

export default new UserSelectMenu<{ action: string }>()
        .setPlaceholder("Select users to assign")
        .run(async (interaction, data) => {
                const users = interaction.users.map((u) => u.username);
                await interaction.reply(
                        `Performing ${data.action} for: ${users.join(", ")}`,
                );
        });
```

### Using Select Menu with Data

```typescript
assignSelect.setData({ action: "assign_role" })
```
