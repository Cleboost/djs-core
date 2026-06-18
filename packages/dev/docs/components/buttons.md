---
title: "Buttons"
icon: "square"
description: "Creating and handling button interactions with djs-core."
---

Buttons are interactive components that users can click to trigger actions in your Discord bot.

<Tip>
  Buttons are automatically registered when placed in `src/components/buttons/`. The customId is generated from the file path, so you don't need to set it manually.
</Tip>

## Creating a Button

Buttons in djs-core are created using the `Button` class.

```typescript [src/components/buttons/my-button.ts]
import { Button } from "@djs-core/runtime";
import { ButtonStyle } from "discord.js";

export default new Button()
  .setLabel("Click me!")
  .setStyle(ButtonStyle.Primary)
  .setCustomId("my-button")
  .run(async (interaction) => {
    await interaction.reply("Button clicked!");
  });
```

## Button Styles

Discord provides several button styles:
- `ButtonStyle.Primary` (Blurple)
- `ButtonStyle.Secondary` (Gray)
- `ButtonStyle.Success` (Green)
- `ButtonStyle.Danger` (Red)
- `ButtonStyle.Link` (Gray with external link icon)

## Using Buttons in Commands

To use a button, import it and add it to an `ActionRowBuilder`.

```typescript
import { Command, Button } from "@djs-core/runtime";
import { ActionRowBuilder } from "discord.js";
import myButton from "../../components/buttons/my-button";

export default new Command()
  .setDescription("Show a button")
  .run(async (interaction) => {
    const row = new ActionRowBuilder<Button>().addComponents(myButton);

    await interaction.reply({
      content: "Click the button below!",
      components: [row],
    });
  });
```

## Passing Data to Buttons

`djs-core` allows you to pass typed data to your buttons using the `.setData()` method.

### 1. Define Button with Data Type
```typescript [src/components/buttons/confirm.ts]
import { Button } from "@djs-core/runtime";
import { ButtonStyle } from "discord.js";

export default new Button<{ userId: string; action: string }>()
  .setLabel("Confirm")
  .setStyle(ButtonStyle.Success)
  .setCustomId("confirm-button")
  .run(async (interaction, data) => {
    await interaction.reply(`Processing ${data.action} for user ${data.userId}`);
  });
```

### 2. Set Data when Using the Button
```typescript
import confirmButton from "../../components/buttons/confirm";

// ... in your command run()
const row = new ActionRowBuilder<Button>().addComponents(
  confirmButton.setData({ userId: interaction.user.id, action: "delete" })
);
```

### Data Time-to-Live (TTL)
You can optionally specify a TTL in seconds for the data storage:
```typescript
confirmButton.setData({ userId: "123" }, 60) // Expires in 60 seconds
```

## Link Buttons

Link buttons navigate to external URLs and don't trigger interaction events.

```typescript [src/components/buttons/website-link.ts]
import { Button } from "@djs-core/runtime";
import { ButtonStyle } from "discord.js";

export default new Button()
  .setLabel("Visit Website")
  .setStyle(ButtonStyle.Link)
  .setURL("https://example.com");
```
