---
"@djs-core/dev": minor
---

Add `djs-core generate` command (alias `g`) to scaffold interaction files from templates.

Supported types: `command`, `button`, `modal`, `select`, `event`, `context`.

```sh
djs-core generate command shop/search
djs-core g button confirm
djs-core g modal feedback --force
```

Creates the file at the correct path with the right imports and a working skeleton. Intermediate directories are created automatically.
