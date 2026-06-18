---
"@djs-core/runtime": minor
---

Add automatic TypeScript inference for command options in `.run()`. Option names and required status are inferred from the builder chain — no manual typing needed.

```ts
new Command()
  .addStringOption(opt => opt.setName("fruit").setRequired(true))
  .addStringOption(opt => opt.setName("color"))
  .run(async (interaction, options) => {
    options.fruit  // string
    options.color  // string | null
  })
```
