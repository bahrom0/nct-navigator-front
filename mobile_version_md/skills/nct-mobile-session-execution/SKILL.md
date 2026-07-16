---
name: nct-mobile-session-execution
description: Execute exactly one NCT Navigator mobile migration session with scoped changes, runtime verification and a precise handoff.
---

# NCT Mobile Session Execution

## Use when

Implementing any file under `../../sessions/`.

## Workflow

1. Read the shared plan and active session completely.
2. Inspect current implementations and git status.
3. State the session goal, assumptions and gate.
4. Identify the smallest vertical change that proves the risky seam.
5. Implement only files required by the active session.
6. Run narrow checks while editing.
7. Exercise the runtime behavior named in the gate.
8. Run required web/backend/mobile regression checks.
9. Update the decision log only for durable decisions.
10. Fill the handoff with exact commands, results and next action.

## Rules

- Do not mark checkboxes based on code inspection alone when the session requires runtime proof.
- Do not implement future-session features to make the current demo prettier.
- Do not replace real backend state with fixtures in the final gate.
- Temporary diagnostics must be removed or explicitly documented.
- Preserve unrelated user changes and report overlapping dirty files before editing them.

## Completion report

```text
Session:
Changed:
Verified:
Gate result:
Remaining risk:
Next exact action:
```
