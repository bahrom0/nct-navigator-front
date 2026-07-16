# Session 04: Recommendation Streaming

## Goal

Deliver real backend analysis progress and native recommendation results with reliable cancellation and retry.

## Preconditions

- Session 03 gate passed.
- Recommendation request/NDJSON event schemas are in shared contracts.
- Backend recommendation invariants remain unchanged.

## Scope

- Implement `expo/fetch` streaming client and incremental NDJSON parser.
- Define typed stage/result/error events and terminal-state handling.
- Drive analysis progress only from backend events.
- Implement cancellation on navigation and app lifecycle transitions.
- Implement retry rules and request/idempotency correlation.
- Render recommendations in a virtualized native list.
- Implement filters/sort only where they preserve current semantics.
- Cache the result snapshot with catalog/version and freshness metadata.
- Handle offline, timeout, malformed stream and backend maintenance.

## Verification

- Receive multiple live stage events and the final result.
- Cancel mid-stream and confirm server/client cleanup where observable.
- Disconnect network mid-stream, retry and verify no duplicate goal/data mutation.
- Test malformed/partial final line parsing.
- Restore a cached result after force stop with an explicit stale state.
- Scroll a representative large result list without rendering all rows at once.

## Gate

Session 04 passes when the complete mobile recommendation flow uses real backend events, survives cancellation/retry and produces canonical recommendation records.

## Do not

- Add fake timer progress.
- Bundle the full NCT database in mobile.
- move scoring or AI validation into the client.
- select/create a goal; that mutation belongs to Session 05.
