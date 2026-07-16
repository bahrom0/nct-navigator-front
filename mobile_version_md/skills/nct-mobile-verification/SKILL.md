---
name: nct-mobile-verification
description: Verify NCT Navigator mobile work across native runtime, backend, web regressions, lifecycle, storage, performance and release gates.
---

# NCT Mobile Verification

## Use when

- closing a migration session;
- claiming auth, storage, streaming, upload or lifecycle behavior works;
- preparing Android/iOS test or store builds;
- diagnosing performance or reliability.

## Evidence hierarchy

1. Real device behavior.
2. Emulator/simulator behavior.
3. Integration/contract tests.
4. Build/typecheck/unit tests.
5. Static code inspection.

Use the highest practical evidence. Do not substitute a lower level without recording the limitation.

## Mandatory patterns

- Auth: sign in, background/foreground, force stop, relaunch, refresh, logout and account switch.
- Storage: create data, kill process, relaunch, migrate schema and verify cleanup.
- Streaming: receive partial events, cancel, lose network, retry and verify no duplicate mutation.
- Media: permission deny/allow, size/type rejection, progress, cancel and retry.
- Navigation: deep link cold/warm start, Android Back, iOS back gesture and invalid target.
- Maintenance: backend `503` propagates through typed state and recovers.
- Performance: record cold start, slow/frozen frames, memory and long-list behavior.

## Regression boundary

Backend/auth/contract changes require checks for both:

- existing web cookie client;
- mobile Bearer client.

## Completion

Read `../../90_VERIFICATION_MATRIX.md`. Attach commands, device/build identifiers and observed results to the handoff. Leave the gate open if required evidence is unavailable.
