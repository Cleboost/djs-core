---
"@djs-core/runtime": minor
---

Add `.autocomplete(optionName, fn)` helper on `Command` for per-option autocomplete handlers. The function receives `(value, interaction)` and returns choices directly — no need to call `getFocused()` or `respond()` manually. Multiple options are supported by chaining. `.runAutocomplete()` remains available as a low-level fallback and is called when no per-option handler matches.
