---
"@djs-core/runtime": patch
---

Refactor ButtonHandler, ModalHandler, and SelectMenuHandler to extend a shared `BaseHandler` abstract class, eliminating ~90 lines of duplicated Map/dispatch logic.
