---
name: nct-mobile-architecture
description: Apply the NCT Navigator mobile architecture boundaries when changing API, authentication, storage, streaming, shared contracts or native app structure.
---

# NCT Mobile Architecture

## Use when

- designing or changing backend endpoints for mobile;
- changing authentication or guest identity;
- introducing shared packages;
- choosing persistence, sync, streaming or realtime behavior;
- changing the native project structure.

## Required inputs

Read:

1. `../../00_START_HERE.md`
2. `../../01_PRODUCT_AND_ARCHITECTURE.md`
3. `../../02_CURRENT_SYSTEM_MAP.md`
4. `../../03_API_AUTH_STORAGE_CONTRACT.md`
5. the active session file

## Checks

Before proposing code, answer:

- What is the source of truth?
- Is the behavior web-only, mobile-only or shared?
- Does an existing backend service already implement the domain logic?
- What is the authenticated identity path?
- What happens after timeout, retry, process death and account switch?
- Is the operation idempotent?
- Does this add a second source of truth?
- Can the contract be validated in both runtimes?

## Constraints

- Prefer a thin API facade over duplicated services.
- Preserve cookie auth while adding Bearer auth.
- Keep contracts free of React, Next and Node-only imports.
- Keep tokens out of SQLite and logs.
- Avoid a new abstraction until a real second consumer requires it.
- Record durable decisions in `../../91_DECISION_LOG.md`.

## Output pattern

```text
Assumption:
Source of truth:
Contract change:
Failure/retry behavior:
Verification gate:
```
