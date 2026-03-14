---
"@djs-core/dev": patch
"@djs-core/plugin-prisma-sqlite": patch
---

Security fix: Disable shell execution in spawnSync calls to prevent potential command injection vulnerabilities.
