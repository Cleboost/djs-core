---
"@djs-core/runtime": minor
"@djs-core/dev": minor
---

Add `.withData<T>()` method to Button, Modal, and all SelectMenu components

- `Button`, `Modal`, `StringSelectMenu`, `UserSelectMenu`, `RoleSelectMenu`, `ChannelSelectMenu`, and `MentionableSelectMenu` now expose `.withData<T>()` to declare the expected data type
- The old generic constructor syntax (`new Button<T>()`) is deprecated in favor of `new Button().withData<T>()`
- New `no-generic-constructor` lint rule in `djs-core check` detects and autofixes the deprecated pattern
