---
title: Role Select Menus
icon: "user-circle"
description: Learn how to create and use role select menu components with djs-core.
---

Role select menus allow users to select one or more Discord roles from the server. They're commonly used for role assignment, permissions management, or role-based features.

<Note>
Role select menus dynamically show all roles available in the server. Users can select from roles they have permission to see, making it perfect for role assignment features.
</Note>

## Creating a Role Select Menu

Role select menus in djs-core are created using the `RoleSelectMenu` class. Each select menu component file in `src/components/selects/role/` is automatically registered.

### Basic Role Select Menu

```typescript
import { RoleSelectMenu } from "@djs-core/runtime";

export default new RoleSelectMenu()
        .setPlaceholder("Select a role")
        .run(async (interaction) => {
                const selectedRole = interaction.roles.first();
                if (selectedRole) {
                        await interaction.reply(`You selected: ${selectedRole.name}`);
                }
        });
```

## Accessing Selected Roles

The `interaction.roles` collection contains all selected roles:

```typescript
import { RoleSelectMenu } from "@djs-core/runtime";

export default new RoleSelectMenu()
        .setPlaceholder("Select roles to assign")
        .run(async (interaction) => {
                const roleMentions = interaction.roles.map((role) => role.toString()).join(" ");
                await interaction.reply(`Selected roles: ${roleMentions}`);
        });
```

## Role Select Menu Data

Role select menus can receive custom data using `.setData()`.

### Component Definition

```typescript [src/components/selects/role/assign.ts]
import { RoleSelectMenu } from "@djs-core/runtime";

export default new RoleSelectMenu<{ userId: string }>()
        .setPlaceholder("Select roles to assign")
        .run(async (interaction, data) => {
                const roles = interaction.roles.map((r) => r.name);
                await interaction.reply(
                        `Assigning roles ${roles.join(", ")} to user ${data.userId}`,
                );
        });
```

### Using Select Menu with Data

```typescript
assignRoleSelect.setData({ userId: interaction.user.id })
```
