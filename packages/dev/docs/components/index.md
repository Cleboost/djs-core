---
title: Components
icon: "puzzle-piece"
description: Learn how to create and manage reusable interaction components with djs-core.
---

Components in djs-core are reusable interaction elements that can be used within command or context menu responses. Unlike interactions (commands and context menus), components are not standalone - they enhance interactions by providing interactive UI elements.

## What are Components?

Components are interactive UI elements that allow users to interact with your bot through buttons, forms, and select menus. They're created as reusable modules that can be imported and used across multiple commands or context menus.

Components help keep your code organized and DRY (Don't Repeat Yourself) by allowing you to define interaction logic once and reuse it throughout your bot.

<Tip>
Components are perfect for creating reusable UI elements. For example, a "Confirm" button can be used across multiple commands without duplicating code. Just import it and use it wherever needed!
</Tip>

## Types of Components

### Buttons

Interactive buttons that users can click to trigger actions. Buttons support custom styles, emojis, and can store custom data.

Learn more in the [Buttons guide](/components/buttons).

### Modals

Form-like dialogs that collect text input from users. Modals can have up to 5 text input fields and are commonly opened from buttons.

Learn more in the [Modals guide](/components/modals).

<Note>
Modals must be opened from a button or other interaction - they cannot be sent directly in messages. Perfect for forms and data collection.
</Note>

### Select Menus

Dropdown menus that allow users to select from predefined options. djs-core supports several types:

- [String Select Menus](/components/string-select-menus)
- [User Select Menus](/components/user-select-menus)
- [Role Select Menus](/components/role-select-menus)
- [Channel Select Menus](/components/channel-select-menus)
- [Mentionable Select Menus](/components/mentionable-select-menus)

## When to Use Components

Components enhance your interactions by providing interactive UI elements. Here's when to use each type:

- **Buttons**: Use for simple actions, confirmations, navigation, or opening modals. Great for interactive responses.
- **Modals**: Use for collecting structured text input from users. Perfect for forms, registration, or multi-field data entry.
- **String Select Menus**: Use when you have a fixed list of text options. Great for settings, categories, or predefined choices.
- **User/Role/Channel/Mentionable Select Menus**: Use when you need dynamic Discord element selection. Perfect for tagging, permissions, or server-specific selections.
