---
"@djs-core/plugin-sql": major
---

Enforce tagged template literals for SQL queries to prevent SQL injection by design.
This is a breaking change that removes support for traditional `(query, params)` syntax in favor of safe-by-default backtick templates: ``sql.execute`SELECT...` ``.
