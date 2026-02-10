# @djs-core/dev

## 4.0.0

### Minor Changes

- 97b702a: Add support of client.config (managed by djs-core)

### Patch Changes

- Updated dependencies [97b702a]
  - @djs-core/runtime@1.5.0

## 3.0.0

### Minor Changes

- f6d3cc1: Add `commands.defaultContext` array to define a default context for all commands (command.setContext overrides config)
- eed4cf3: Add cron tasks support. Cron tasks can be enabled in `djs.config.ts` as an experimental feature (`experimental.cron: true`). Tasks are defined in `src/cron/` using the fluent API: `new Task().cron("* * * * *").run((client) => { ... })`.

### Patch Changes

- 909cda3: Fix source directory detecton for bundle interactions/events/components
- Updated dependencies [f6d3cc1]
- Updated dependencies [eed4cf3]
  - @djs-core/runtime@1.4.0

## 2.0.0

### Patch Changes

- 6111713: Rename eventLister --> eventListner Class
- e78846c: Fix modal reload causing multiple reloads and errors
- Updated dependencies [6111713]
  - @djs-core/runtime@1.3.0
