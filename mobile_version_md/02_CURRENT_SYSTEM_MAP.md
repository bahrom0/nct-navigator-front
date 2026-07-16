# Current System Map

This document records the implementation seams observed before mobile work. Re-verify paths before editing because the repository can change.

## Current stack

- Web: Next.js 16, React 19, Tailwind, Framer Motion, Zustand and Zod.
- Backend: standalone Next.js application in `backend/`.
- Frontend proxy: `next.config.ts` rewrites `/api/*` and `/auth/*` to `BACKEND_ORIGIN`.
- Authentication: Supabase session cookies created/read by backend route handlers.
- Maintenance: backend proxy returns a structured `503`; web `AppShell` observes fetch responses.
- Persistence: browser `localStorage` and `sessionStorage` plus server profile sync.
- Streaming: recommendation POST returns NDJSON; community chat uses SSE; AI chat uses streamed responses.
- Media: community chat supports file upload.

## Current product routes

Core:

- `/onboarding`
- `/categories`
- `/analyze`
- `/recommendations`
- `/interview`
- `/plan`
- `/coach`

Supporting:

- `/dashboard` and profile subsections
- `/teacher`
- `/chat`
- `/fit-score`
- `/strategy`
- `/explain`

Marketing routes remain web-only unless the product decision changes.

## Browser-specific seams to replace

| Web mechanism | Current examples | Native replacement |
|---|---|---|
| Relative API URLs | `/api/...` calls throughout client | typed `ApiClient` with environment base URL |
| Cookie auth | `src/stores/auth-store.ts` | Supabase mobile session + Bearer header |
| Browser OAuth redirect | `window.location.href` | system auth session + app/universal link |
| Browser storage | onboarding/profile/cache stores | SecureStore + SQLite repositories |
| Next router/history | pages, Link, router | Expo Router/native stacks and tabs |
| DOM/layout APIs | window, document, portals, matchMedia | React Native/Expo platform APIs |
| Global fetch interception | `src/components/app-shell.tsx` | API middleware and global app status state |
| CSS responsive states | `globals.css` media queries | flex layout, window dimensions and platform styles |
| DOM animation | Framer Motion | Reanimated/native transitions where useful |

## Backend risks to resolve early

1. Many protected routes call a cookie-based Supabase server client directly.
2. No single versioned mobile/web API facade currently defines stable errors and auth behavior.
3. Streaming/realtime auth and reconnect behavior is tied to browser assumptions.
4. An in-memory SSE manager may not be safe across horizontally scaled backend instances.
5. Create/retry operations need an explicit idempotency contract for unreliable mobile networks.
6. Chat pagination, media constraints and upload progress need mobile-ready contracts.

## State migration risks

- `sessionStorage` currently carries guest identity, caches and cross-route handoff state.
- A literal AsyncStorage port would preserve fragile page coupling.
- Guest data cannot magically move from an unauthenticated web browser to a phone.
- Account sync must be server-owned; guest-to-account merge must be explicit and idempotent.
- Logout/account switch must remove local user-scoped rows while preserving only safe application settings.

## Canonical files to inspect before implementation

- `next.config.ts`
- `src/stores/auth-store.ts`
- `src/stores/profile-store.ts`
- `src/stores/onboarding-store.ts`
- `src/components/app-shell.tsx`
- `src/app/recommendations/page.tsx`
- `src/app/interview/page.tsx`
- `src/app/plan/page.tsx`
- `src/components/coach/`
- `src/lib/user-chat/`
- `backend/src/proxy.ts`
- `backend/src/lib/supabase/server.ts`
- `backend/src/app/api/auth/`
- `backend/src/app/api/recommendations/stream/route.ts`
- `backend/src/app/api/chat/stream/route.ts`
- `backend/src/app/api/user-chat/`

Do not infer current behavior only from this map. Trace the live route/service path whenever a session changes it.
