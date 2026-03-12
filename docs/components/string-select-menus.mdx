---
title: String Select Menus
icon: "list"
description: Learn how to create and use string select menu components with djs-core.
---

String select menus (also called dropdowns) allow users to select one or more options from a predefined list of text choices.

<Note>
String select menus can display up to 25 options and support emojis, descriptions, and custom values. They're perfect for choices that don't change dynamically.
</Note>

## Creating a String Select Menu

String select menus in djs-core are created using the `StringSelectMenu` class. Each select menu component file in `src/components/selects/string/` is automatically registered.

### Basic Select Menu

```typescript
import { StringSelectMenu } from "@djs-core/runtime";

export default new StringSelectMenu()
        .setPlaceholder("Choose a color")
        .addOptions([
                { label: "Red", value: "red" },
                { label: "Blue", value: "blue" },
                { label: "Green", value: "green" },
        ])
        .run(async (interaction) => {
                const selectedColor = interaction.values[0];
                await interaction.reply(`You selected: ${selectedColor}`);
        });
```

## Multiple Selections

String select menus can allow users to select multiple options:

```typescript
import { StringSelectMenu } from "@djs-core/runtime";

export default new StringSelectMenu()
        .setPlaceholder("Select your interests")
        .setMinValues(1)
        .setMaxValues(5)
        .addOptions([
                { label: "Gaming", value: "gaming" },
                { label: "Music", value: "music" },
                { label: "Sports", value: "sports" },
        ])
        .run(async (interaction) => {
                const interests = interaction.values;
                await interaction.reply(`You selected: ${interests.join(", ")}`);
        });
```

## Select Menu Data

Select menus can receive custom data using `.setData()`, just like buttons and modals.

### Component Definition

```typescript [src/components/selects/string/product.ts]
export default new StringSelectMenu<{ category: string }>()
        .run(async (interaction, data) => {
                const product = interaction.values[0];
                await interaction.reply(`Selected ${product} from category: ${data.category}`);
        });
```

### Using Select Menu with Data

```typescript
productSelect.setData({ category: "electronics" })
```
