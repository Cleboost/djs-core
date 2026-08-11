---
"@djs-core/dev": minor
"@djs-core/runtime": patch
---

Collapse dev startup load logs into a compact summary.

- Replace per-file load lines with a single summary showing counts for commands, buttons, modals, select menus, context menus, events, crons, and tasks
- Add `loadSummary()` on the shared logger for grouped startup output
