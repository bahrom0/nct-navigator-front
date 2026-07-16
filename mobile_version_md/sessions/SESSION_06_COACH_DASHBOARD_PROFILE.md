# Session 06: Coach, Dashboard and Profile

## Goal

Make the active goal useful day-to-day through native Coach, progress and profile experiences.

## Preconditions

- Session 05 vertical-slice gate passed.
- Coach persistence/source-of-truth paths are traced.
- Local cache ownership and invalidation are defined.

## Scope

Implement in this order:

1. Home summary and next action.
2. Coach roadmap.
3. Daily plan and todo mutations.
4. Progress/streak and diagnostics.
5. Coach chat and history.
6. Profile plans, bookmarks, interviews, activity and achievements.
7. AI Teacher as secondary help tooling.

Requirements:

- All views resolve the same active goal.
- Cached read-only state is clearly marked when stale/offline.
- Todo/progress mutations are idempotent and sync-safe.
- Long roadmap/history lists are virtualized.
- Previous context required by Coach is server-owned and preserved.

## Verification

- Continue from the Session 05 goal into roadmap and daily work.
- Complete/retry a todo without duplicate progress.
- Force stop and restore the active goal/roadmap cache.
- Switch goals/accounts and verify no cross-user/state leakage.
- Exercise Coach chat with history and background/foreground transition.
- Compare critical profile counts/records with server/web truth.

## Gate

Session 06 passes when Home, Coach and Profile consistently reflect one server-owned goal across restart, offline cache and sync.

## Do not

- Recreate backend Coach planning logic locally.
- elevate AI Teacher above the main Coach flow.
- ship placeholder dashboard numbers as real metrics.
