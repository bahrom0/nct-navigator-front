# Mobile Version: Start Here

## Objective

Build a production-grade Android and iOS client for NCT Navigator with native React Native UI. The result must not be a web wrapper. The mobile client must preserve the existing product semantics while using the current backend and Supabase data safely.

## Canonical decision

- Client: React Native + stable Expo SDK + TypeScript.
- Development: Expo development build, not Expo Go as the production foundation.
- Android: Android Studio for SDK, emulator, Gradle, profiling and native debugging.
- iOS: EAS/macOS build pipeline plus Xcode and a real iPhone for final verification.
- Backend: existing `backend/` application and domain services.
- Shared code: API contracts, Zod schemas, DTOs and pure TypeScript only.
- Storage: SecureStore for tokens; SQLite for local application data; Zustand for live UI state.

APK is an Android artifact. Google Play release uses AAB. iOS release uses a signed iOS build distributed through TestFlight/App Store.

## Plan map

| File | Purpose |
|---|---|
| `01_PRODUCT_AND_ARCHITECTURE.md` | Product invariants, target architecture and non-goals |
| `02_CURRENT_SYSTEM_MAP.md` | Current web/backend seams that mobile must replace |
| `03_API_AUTH_STORAGE_CONTRACT.md` | Network, auth, persistence, streaming and errors |
| `04_MOBILE_UX_AND_DESIGN_SYSTEM.md` | Native navigation and UI rules |
| `sessions/SESSION_00_*.md` | Audit and baseline |
| `sessions/SESSION_01_*.md` to `SESSION_10_*.md` | Ordered implementation sessions |
| `90_VERIFICATION_MATRIX.md` | Cross-session acceptance evidence |
| `91_DECISION_LOG.md` | Durable architectural decisions |
| `92_HANDOFF_TEMPLATE.md` | Current status and exact next action |

## Execution order

1. Session 00: discovery and baseline.
2. Session 01: native foundation.
3. Session 02: auth and lifecycle.
4. Session 03: onboarding and interests.
5. Session 04: recommendation streaming.
6. Session 05: goal, interview and plan.
7. Session 06: Coach, dashboard and profile.
8. Session 07: community chat and media.
9. Session 08: offline behavior, notifications and native integrations.
10. Session 09: Android hardening and release.
11. Session 10: iOS hardening, TestFlight and release.

Sessions are dependency ordered. A later session may be inspected for context but must not be implemented before the current gate passes.

## First proof milestone

The first meaningful proof is not a collection of screens. It is this working chain:

```text
native launch
  -> backend health/maintenance
  -> mobile authentication
  -> secure session restoration after process restart
  -> one authenticated backend call
  -> Android debug build installed on emulator/device
```

The second proof is the canonical vertical slice:

```text
onboarding -> interests -> recommendation stream -> goal -> interview -> plan
```

Do not expand into community chat, push notifications or full dashboard work until the vertical slice is stable.

## Definition of complete

The migration is complete only when:

- core screens contain no WebView;
- Android and iOS use the same backend domain logic;
- web cookie auth still works and mobile Bearer auth works;
- tokens are stored securely and user data is cleared on account switch/logout;
- process death, offline, maintenance, 401, timeout and retry states are handled;
- real backend progress powers AI loading states;
- both platforms are tested on physical devices and their store test tracks;
- performance, crash telemetry, privacy and rollback requirements are met.
