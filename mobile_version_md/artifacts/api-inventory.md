# API Inventory Baseline

- Captured: 2026-07-16
- Repository baseline: `0cb0e5c`
- Backend: Next.js application under `backend/`
- Public web proxy: `/api/*` and `/auth/*` are rewritten through `BACKEND_ORIGIN`

This is a migration inventory, not a permanent API specification. Re-read the live route and service before changing an endpoint.

## System and authentication

| Endpoint | Methods | Current identity/transport | Mobile note |
|---|---|---|---|
| `/api/system/status` | GET | Public JSON | Session 01 health/maintenance proof endpoint |
| `/api/auth/session` | GET | Supabase cookie session | Mobile must use Bearer-aware identity in Session 02 |
| `/api/auth/login` | POST | Creates cookie session | Mobile auth adapter needed |
| `/api/auth/signup` | POST | Creates cookie session | Mobile auth adapter needed |
| `/api/auth/logout` | POST | Clears cookie session | Mobile secure-session cleanup needed |
| `/api/auth/google` | GET | Browser redirect | Replace with mobile auth session/deep link |
| `/auth/callback` | GET | Browser callback | Mobile callback scheme belongs to Session 02 |

Admin endpoints remain backend/web operational surfaces and are not mobile product screens:

- `/api/admin/login`
- `/api/admin/logout`
- `/api/admin/session`
- `/api/admin/server-control`

## Recommendation and core path

| Endpoint | Methods | Access/transport | Product use |
|---|---|---|---|
| `/api/analyze` | POST | JSON, currently no explicit auth gate | Interest analysis |
| `/api/recommendations` | POST | JSON | Non-stream fallback/result request |
| `/api/recommendations/stream` | POST | NDJSON | Real analysis stage events and result |
| `/api/goals/select` | POST | Cookie-authenticated | Canonical recommendation-to-goal selection |
| `/api/goals/clear` | POST | Cookie-authenticated | Clear active goal |
| `/api/interview/start` | POST | JSON | Start interview |
| `/api/interview/answer` | POST | JSON | Continue interview |
| `/api/generate-plan` | POST | Cookie-aware/authenticated | Generate canonical plan |
| `/api/save-plan` | POST | Cookie-authenticated | Persist plan |

The tested recommendation stream emitted:

1. `submitting_request`
2. `analyzing_interests`
3. `searching_nct_codes`
4. `forming_recommendations`
5. terminal `result`

## Plan and Coach

| Endpoint | Methods | Current access |
|---|---|---|
| `/api/plan/full` | GET | Authenticated |
| `/api/plan/get` | POST | Authenticated |
| `/api/plan/regenerate` | POST | Route-specific validation; re-check before mobile use |
| `/api/plan/todos` | PATCH | Authenticated |
| `/api/plan/test-questions` | POST | Route-specific validation |
| `/api/plan/test-evaluate` | POST | Route-specific validation |
| `/api/coach/goal` | POST | Currently returns a client-shaped goal without durable auth ownership |
| `/api/coach/roadmap` | POST | Authenticated |
| `/api/coach/daily-plan` | GET, POST | Authenticated |
| `/api/coach/progress` | POST, PATCH | Authenticated |
| `/api/coach/messages` | GET, POST, PATCH | Authenticated |
| `/api/coach/chat` | POST | Route-specific context/auth; re-check |
| `/api/coach/diagnose` | POST | JSON |
| `/api/coach/diagnose/evaluate` | POST | JSON |
| `/api/coach/mini-test-report` | POST | JSON |
| `/api/coach/task-detail` | POST | JSON |

## Profile and supporting AI

| Endpoint | Methods | Current access |
|---|---|---|
| `/api/sync-profile` | GET, POST | Cookie-authenticated; live unauthenticated GET returned `401` |
| `/api/fit-score` | POST | JSON |
| `/api/explain` | POST | JSON |
| `/api/strategy` | POST | JSON |
| `/api/teacher/chat` | POST | Stream/JSON behavior must be traced in Session 06 |

`/api/setup-db` is an operational/development route. It must not become part of the mobile public contract.

## Legacy AI chat sessions

- `GET,POST /api/chat/sessions`
- `PUT,DELETE /api/chat/sessions/[id]`
- `GET,POST /api/chat/sessions/[id]/messages`
- `POST /api/chat/name`
- `GET /api/chat/stream` using authenticated SSE

These belong to later Coach/AI-chat work. The SSE manager is currently in process memory and must be checked against deployment topology before mobile depends on it.

## Community chat and media

- `GET,POST /api/user-chat/conversations`
- `GET /api/user-chat/conversations/[id]`
- `GET,POST /api/user-chat/conversations/[id]/messages`
- `PUT,DELETE /api/user-chat/conversations/[id]/messages/[messageId]`
- `GET,PUT /api/user-chat/profile`
- `GET /api/user-chat/users`
- `GET /api/user-chat/users/[id]`
- `POST /api/user-chat/media/upload` using multipart form data

These routes use server-side user guards/membership checks. Session 07 must preserve them and add mobile-safe pagination, reconnect and upload behavior rather than bypassing the guard.

## Contract gaps before mobile use

- No stable versioned `/api/v1` facade yet.
- Protected routes primarily resolve identity from Supabase cookies.
- Error envelopes are not uniform.
- Mobile idempotency behavior is not defined for goal/plan/message mutations.
- Streaming cancellation/resume behavior is not a documented public contract.
- Mobile environment must use an explicit API origin rather than Next.js rewrites.
