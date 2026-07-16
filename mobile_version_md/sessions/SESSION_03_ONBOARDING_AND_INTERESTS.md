# Session 03: Onboarding and Interests

## Goal

Implement the first native product flow from profile setup through validated interest/category selection.

## Preconditions

- Session 02 gate passed.
- Current onboarding schema and role/location option semantics are traced from source.
- Draft persistence repository/migration strategy is agreed.

## Scope

- Implement native onboarding stack and progress semantics.
- Preserve current Tajikistan-specific location and education/profile choices.
- Implement touch-friendly category/interest selection with accessibility.
- Add Zod validation at input and persistence boundaries.
- Persist onboarding draft in SQLite with schema version and timestamps.
- Restore draft after process death.
- Support deliberate reset and user/account ownership cleanup.
- Emit the same canonical analytics/activity intent where applicable.

## Verification

- Complete onboarding with representative valid paths.
- Validate required/invalid fields and back navigation.
- Force stop mid-flow, relaunch and restore the exact draft/step.
- Switch account/logout and verify user-scoped draft cleanup rules.
- Test compact Android screen, keyboard, font scaling and screen reader labels.
- Compare final payload with current backend/web schema.

## Gate

Session 03 passes when a restored native draft produces a backend-compatible final onboarding payload without browser storage or DOM dependencies.

## Do not

- Simplify or rename product options without explicit approval.
- Add recommendation generation UI.
- use a fake local user profile as the server source of truth.
