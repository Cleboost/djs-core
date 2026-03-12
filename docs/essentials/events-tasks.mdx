---
title: "Cron Tasks"
icon: "calendar-check"
description: "How to run scheduled tasks in djs-core."
---

`djs-core` provides structured ways and background tasks, keeping your bot logic modular and easy to manage.

Cron tasks allow you to run code at specific intervals. This is useful for cleanup, daily messages, or background processing.

<Info>
  **Experimental Feature**: To use cron tasks, you must enable them in your `djs.config.ts`.
</Info>

```typescript [djs.config.ts]
export default defineConfig({
  // ...
  experimental: {
    cron: true,
  },
});
```

Create a task file in `src/cron/`.

```typescript [src/cron/hourly-cleanup.ts]
import { Task } from "@djs-core/runtime";

export default new Task()
  .cron("0 * * * *") // Every hour
  .run((client) => {
    console.log("Starting hourly cleanup...");
    // Your cleanup logic here
  });
```

### Key Methods

- **`.cron("expression")`**: A standard cron expression (e.g., `* * * * *` for every minute).
- **`.run((client) => { ... })`**: The code to execute when the task runs.