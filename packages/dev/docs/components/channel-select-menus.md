---
title: Channel Select Menus
icon: "hashtag"
description: Learn how to create and use channel select menu components with djs-core.
---

Channel select menus allow users to select one or more Discord channels from the server. They're useful for channel configuration, announcements, or channel-based features.

<Note>
Channel select menus dynamically show all channels the user can see. You can filter which channel types users can select using `setChannelTypes()`.
</Note>

## Creating a Channel Select Menu

Channel select menus in djs-core are created using the `ChannelSelectMenu` class. Each select menu component file in `src/components/selects/channel/` is automatically registered.

### Basic Channel Select Menu

```typescript
import { ChannelSelectMenu } from "@djs-core/runtime";

export default new ChannelSelectMenu()
        .setPlaceholder("Select a channel")
        .run(async (interaction) => {
                const selectedChannel = interaction.channels.first();
                if (selectedChannel) {
                        await interaction.reply(`You selected: ${selectedChannel.name}`);
                }
        });
```

## Channel Types

You can filter which channel types users can select:

```typescript
import { ChannelSelectMenu } from "@djs-core/runtime";
import { ChannelType } from "discord.js";

export default new ChannelSelectMenu()
        .setPlaceholder("Select a text channel")
        .setChannelTypes([ChannelType.GuildText])
        .run(async (interaction) => {
                const channel = interaction.channels.first();
                if (channel) {
                        await interaction.reply(`Selected text channel: ${channel.name}`);
                }
        });
```

## Channel Select Menu Data

Channel select menus can receive custom data using `.setData()`.

### Component Definition

```typescript [src/components/selects/channel/config.ts]
import { ChannelSelectMenu } from "@djs-core/runtime";

export default new ChannelSelectMenu<{ category: string }>()
        .setPlaceholder("Select channels")
        .run(async (interaction, data) => {
                const channels = interaction.channels.map((ch) => ch.name);
                await interaction.reply(
                        `Configured ${data.category} channels: ${channels.join(", ")}`,
                );
        });
```

### Using Select Menu with Data

```typescript
configChannelSelect.setData({ category: "announcements" })
```
