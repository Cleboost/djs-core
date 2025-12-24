# @djs-core/runtime

## 1.4.0

### Minor Changes

- f6d3cc1: Add `commands.defaultContext` array to define a default context for all commands (command.setContext overrides config)
- eed4cf3: Add cron tasks support. Cron tasks can be enabled in `djs.config.ts` as an experimental feature (`experimental.cron: true`). Tasks are defined in `src/cron/` using the fluent API: `new Task().cron("* * * * *").run((client) => { ... })`.

## 1.3.0

### Minor Changes

- 6111713: Add Client in .run() method for EventListner & rename eventLister --> eventListner
