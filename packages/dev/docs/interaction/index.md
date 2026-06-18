---
title: Interactions
icon: "message"
description: Learn how to create and manage Discord interactions with djs-core.
---

Interactions in djs-core refer to **Application Commands** - the primary way users invoke your bot's functionality directly from Discord's interface.

## What are Interactions?

Interactions are commands that users can trigger through Discord's command interface. In djs-core, there are two types of interactions:

- **Slash Commands**: Typed commands that appear in Discord's command menu
- **Context Menus**: Right-click commands that appear when clicking on users or messages

## Types of Interactions

### Commands (Slash Commands)

Slash commands are typed commands that users can invoke using Discord's command palette. They can accept various types of options (text, users, channels, etc.) and support autocomplete.

Learn more in the [Commands guide](/interaction/commands).

### Context Menus

Context menus are commands that appear when users right-click on Discord elements (users or messages). They provide quick access to bot functionality directly from the context menu.

Learn more in the [Context Menus guide](/interaction/context-menus).

## Note on Components

Buttons, select menus, and modals are **not** interactions - they are [components](/components/index) that can be used within command or context menu responses to create interactive experiences.

## Frequently Asked Questions

<AccordionGroup>
  <Accordion icon="circle-question" title="What's the difference between commands and context menus?">
    **Commands** (slash commands) are typed by users in Discord's command palette (type `/` to see them). They appear as suggestions as you type and can accept various options like text, users, channels, etc.

    **Context menus** appear when you right-click on Discord elements (users or messages). They provide quick actions without typing, perfect for moderation, user info, or message-specific actions.
  </Accordion>

  <Accordion icon="circle-question" title="How do I organize my commands?">
    Commands are organized using the file structure. For example:
    - `src/interactions/commands/ping.ts` → `/ping`
    - `src/interactions/commands/admin/kick.ts` → `/admin kick`
    - `src/interactions/commands/shop/buy.ts` → `/shop buy`

    Subdirectories automatically create command groups in Discord.
  </Accordion>

  <Accordion icon="circle-question" title="Can I use components in interactions?">
    Yes! Components (buttons, modals, select menus) are designed to be used within command or context menu responses. They enhance interactions by providing interactive UI elements that users can click or interact with.
  </Accordion>

  <Accordion icon="circle-question" title="Do commands auto-register?">
    Yes! Commands and context menus are automatically registered when your bot starts. In development mode, all commands are registered on startup. The framework handles all the registration logic for you.
  </Accordion>
</AccordionGroup>
