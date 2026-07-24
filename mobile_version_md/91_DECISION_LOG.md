# Mobile Decision Log

Record only durable decisions that constrain later sessions. Do not use this file as a daily activity log.

## D-001: Native client technology

- Status: accepted
- Decision: React Native + stable Expo SDK + TypeScript with Expo development builds.
- Reason: preserves React/TypeScript expertise and shared pure contracts while rendering native platform components.
- Rejected: WebView/Capacitor as core architecture; full Flutter rewrite; separate Kotlin and Swift products.
- Revisit if: a proven required capability cannot be implemented or supported safely through the chosen native stack.

## D-002: Backend ownership

- Status: accepted
- Decision: existing backend/domain services remain the source of truth; mobile receives a thin versioned API/auth facade.
- Reason: prevents duplicated recommendation, NCT, plan and Coach logic.

## D-003: Persistence split

- Status: accepted
- Decision: SecureStore for tokens/short secrets; SQLite for versioned cache/drafts/outbox; Zustand for live UI state.
- Reason: separates security, durability and presentation concerns.

## D-004: Migration order

- Status: accepted
- Decision: prove native foundation/auth, then the onboarding-to-plan vertical slice, then Coach/profile, community and native extras.
- Reason: validates the highest-risk seams before multiplying screens.

## D-005: Marketing scope

- Status: accepted
- Decision: landing/features/how-it-works remain web content for the mobile MVP.
- Reason: keeps the native app focused on product workflows.

## D-006: Mobile project isolation

- Status: accepted
- Decision: create `mobile/` as an independent npm project with its own `package.json`, lockfile, dependencies and generated native state; do not add root workspaces or modify root web dependencies in Session 01.
- Reason: isolates React Native/Expo tooling from the existing Next.js web and backend builds while keeping one repository and shared history.
- Revisit if: shared contract consumption requires a minimal workspace/package mechanism after the native foundation is proven.

## D-007: Provisional application identity

- Status: accepted for development only
- Decision: use slug `nct-navigator-mobile`, scheme `nctnavigator` and provisional Android id `com.nctnavigator.mobile`, with separate development/preview suffixes.
- Reason: Session 01 needs stable local identifiers before final organization/store identity is known.
- Revisit if: before the first signed release or as soon as the organization-owned reverse-domain identifier is confirmed.

## New decision template

```text
## D-XXX: Title

- Date:
- Status: proposed | accepted | superseded
- Session:
- Decision:
- Evidence/context:
- Alternatives rejected:
- Consequences:
- Revisit if:
```
