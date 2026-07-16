# Mobile Version Agent Rules

These instructions apply to the mobile migration plan and to all implementation work performed from it.

## Required reading order

Before changing mobile, backend, shared contracts, auth, streaming, or release configuration:

1. Read `00_START_HERE.md`.
2. Read `01_PRODUCT_AND_ARCHITECTURE.md`.
3. Read `02_CURRENT_SYSTEM_MAP.md`.
4. Read `03_API_AUTH_STORAGE_CONTRACT.md`.
5. Read `04_MOBILE_UX_AND_DESIGN_SYSTEM.md` for UI work.
6. Read the current file under `sessions/` completely.
7. Read the relevant files under `skills/` completely.
8. Read `90_VERIFICATION_MATRIX.md` before declaring the session complete.
9. Update `91_DECISION_LOG.md` and `92_HANDOFF_TEMPLATE.md` at the end of the session.

Do not read only the session checklist. The shared architectural constraints are part of every session.

## Product invariants

- Preserve the canonical flow: onboarding -> interests -> recommendations -> goal -> interview -> plan -> Coach.
- Keep AI Teacher secondary to the main goal/Coach flow.
- Keep marketing pages on web unless a session explicitly changes that decision.
- Backend services remain the source of truth for NCT data, recommendations, plans, Coach state and server-owned chat data.
- Mobile persistence is a cache/draft/outbox layer, not a second backend.
- Do not invent NCT, user, recommendation, plan or chat data.

## Architecture invariants

- Build native React Native screens. Do not use WebView/Capacitor for core screens.
- Do not copy React DOM components, Next layouts, Tailwind classes or browser routing into `mobile/`.
- Share only pure TypeScript contracts, schemas and functions with no React, Next, Node-only or secret-bearing imports.
- Mobile calls an explicit backend base URL. It does not depend on `next.config.ts` rewrites.
- Backend authentication must support existing web cookies and mobile Bearer tokens without breaking web.
- Never expose Supabase service-role credentials or server secrets to the app bundle.
- SecureStore is for tokens and short secrets. SQLite is for versioned cache, drafts and outbox. Zustand is for live UI orchestration.
- Long-running AI progress must come from real backend events. Do not add fake progress timers.
- Any create/retry flow that can duplicate data must be idempotent.

## Session discipline

- Work on one session only unless the user explicitly expands scope.
- Inspect current code and nearby patterns before editing.
- State the session goal and success gate before implementation.
- Keep changes reviewable; avoid broad repo moves and unrelated cleanup.
- Do not silently change product semantics to make mobile implementation easier.
- If the current session reveals a later-session concern, record it in the decision log or handoff instead of implementing it early.
- A session is incomplete until its runtime gate is exercised. Compilation alone is not enough for auth, storage, streaming, deep links, uploads or lifecycle behavior.

## Source control and generated files

- Preserve unrelated user changes.
- Do not commit `.env`, keystores, signing certificates, provisioning profiles, access tokens or service-role keys.
- Do not commit generated build directories, local Android SDK paths or device-specific state.
- Commit dependency lockfile changes intentionally.
- Record generated native directories and the regeneration command if Expo prebuild/CNG is used.

## Verification requirements

- Run the narrowest relevant tests during development.
- For backend changes, run backend type/build/tests and exercise both cookie and Bearer paths where relevant.
- For web-adjacent changes, run the web build and exercise the affected canonical flow.
- For mobile changes, run typecheck/lint/tests plus an actual Android emulator or device flow.
- For lifecycle/storage changes, kill and relaunch the process; hot reload is not verification.
- For performance sessions, collect measurements rather than reporting subjective smoothness.
- iOS completion requires an iOS build and real iPhone/TestFlight evidence; Android-only evidence cannot close an iOS gate.

## Skills routing

- Discoverable project skill entrypoints live under `.agents/skills/`; their canonical instructions live in this folder.
- Architecture/API/auth/storage decisions: read `skills/nct-mobile-architecture/SKILL.md`.
- Any implementation session: read `skills/nct-mobile-session-execution/SKILL.md`.
- Completion, release or performance claims: read `skills/nct-mobile-verification/SKILL.md`.

## When blocked

- Do not bypass a failed gate with placeholders presented as complete.
- Record the exact command, error, affected gate and safest next action in `92_HANDOFF_TEMPLATE.md`.
- If iOS infrastructure is unavailable, continue only with platform-neutral work and leave the iOS gate open.
- If a backend contract is ambiguous, inspect the live route/service path before proposing a new endpoint.
