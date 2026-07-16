# Session 05: Goal, Interview and Plan

## Goal

Complete the canonical vertical slice from one selected recommendation through interview and generated plan.

## Preconditions

- Session 04 gate passed.
- Goal, interview and plan server paths have stable contracts.
- Create/retry idempotency behavior is defined.

## Scope

- Select exactly one recommendation as the active goal.
- Preserve decision context needed by backend goal selection.
- Implement native interview question/answer flow and draft recovery.
- Submit/continue interview without duplicating sessions after retry.
- Generate and persist the plan through existing backend services.
- Implement plan summary/detail and handoff into Coach.
- Cache safe read-only plan content for offline viewing.
- Preserve route order: recommendation -> interview -> plan -> Coach.
- Support recovery when a goal exists but interview/plan state is incomplete.

## Verification

- Complete the full flow with a real recommendation result.
- Kill/relaunch during interview and restore progress.
- Trigger retry/timeouts around goal selection and plan creation; verify one canonical record.
- Deep link/reopen the active plan and recover the correct goal context.
- Verify web goal/interview/plan flow still works after contract changes.
- Verify offline plan view and clear network-required actions.

## Gate

Session 05 passes when a user can cold-start the app, complete onboarding through plan, relaunch, and continue into Coach with the same canonical goal.

## Do not

- Add a separate mobile-only goal truth.
- skip interview to simplify navigation.
- generate plans locally.
- implement the full Coach feature set.
