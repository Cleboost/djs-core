# @djs-core/runtime

## 1.6.0

### Minor Changes

- b69f939: refactor: unify interaction data storage, centralize token management and remove deprecated DataStore aliases

### Patch Changes

- 6e18dea: feat: add comprehensive test suite (unit + E2E integration) and improve CommandHandler debug logging
- 4d96d3f: style: fix all biome linting and formatting issues and improve type safety by removing biome-ignore suppressions
- 3ff0882: fix: rename EventListner to EventListener to fix typo
- 69e4e9d: refactor: centralize route parsing logic into shared utilities
- 74da6f4: refactor: simplify select menu dispatch and optimize command option copying
- fc19372: refactor: standardize interaction error handling across all handlers

## 1.5.0

### Minor Changes

- 97b702a: Add support of client.config (managed by djs-core)

## 1.4.0

### Minor Changes

- f6d3cc1: Add `commands.defaultContext` array to define a default context for all commands (command.setContext overrides config)
- eed4cf3: Add cron tasks support. Cron tasks can be enabled in `djs.config.ts` as an experimental feature (`experimental.cron: true`). Tasks are defined in `src/cron/` using the fluent API: `new Task().cron("* * * * *").run((client) => { ... })`.

## 1.3.0

### Minor Changes

- 6111713: Add Client in .run() method for EventListner & rename eventLister --> eventListner
