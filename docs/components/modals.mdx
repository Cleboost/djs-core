---
title: "Modals"
icon: "window-maximize"
description: "Handling modal submissions and data entry in djs-core."
---

Modals provide a way to collect multi-line text input from users. `djs-core` handles modal submissions using the `Modal` handler class.

## Creating a Modal Handler

Create a `.ts` file in `src/interactions/modals`.

```typescript src/interactions/modals/feedback.ts
import { Modal } from "@djs-core/runtime";

export default new Modal()
  .setCustomId("feedback-modal")
  .run(async (interaction) => {
    const feedback = interaction.fields.getTextInputValue("feedback-input");
    const name = interaction.fields.getTextInputValue("name-input");
    
    await interaction.reply({ content: `Thanks ${name}! Feedback: ${feedback}`, ephemeral: true });
  });
```

To show the modal in a command or button:
```typescript
import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";

const modal = new ModalBuilder()
  .setCustomId("feedback-modal")
  .setTitle("Give us Feedback");

const nameInput = new TextInputBuilder()
  .setCustomId("name-input")
  .setLabel("Your Name")
  .setStyle(TextInputStyle.Short);

const feedbackInput = new TextInputBuilder()
  .setCustomId("feedback-input")
  .setLabel("Your Feedback")
  .setStyle(TextInputStyle.Paragraph);

modal.addComponents(
  new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
  new ActionRowBuilder<TextInputBuilder>().addComponents(feedbackInput)
);

await interaction.showModal(modal);
```

## Passing Data (Routing)

Modals also support dynamic `customId` parameters. This is useful for knowing which user or object the modal is for.

```typescript src/interactions/modals/edit-user.ts
import { Modal } from "@djs-core/runtime";

export default new Modal()
  .setCustomId("user:edit/:userId")
  .run(async (interaction) => {
    const userId = interaction.params.userId;
    const newNickname = interaction.fields.getTextInputValue("nickname-input");
    
    // logic to update user userId...
    await interaction.reply(`Updated nickname for user ${userId} to ${newNickname}!`);
  });
```

Create it like this:
```typescript
new ModalBuilder()
  .setCustomId(`user:edit/${targetUser.id}`)
  .setTitle(`Editing ${targetUser.username}`)
  .addComponents(...)
```

## Key Characteristics

- **`interaction.fields.getTextInputValue(id)`**: Method to retrieve values from the modal.
- **`interaction.params`**: Available if you use dynamic `customId` routing.
- ** पैटर्न Matching**: Works the same way as buttons and select menus.
