---
"@djs-core/runtime": patch
---

Optimize application command registration by implementing parallel guild synchronization (via Promise.all) to improve performance and adding unit tests for command synchronization.
