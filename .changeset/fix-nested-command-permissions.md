---
"@djs-core/runtime": patch
---

Fix `default_member_permissions` not being applied when commands are nested under subcommand groups (e.g. `admin.logs.export`). Permissions from leaf commands are now merged onto the root slash command during sync.

Add a console warning when subcommands under the same root command define different `default_member_permissions`, since Discord only supports one permission set per root command.
