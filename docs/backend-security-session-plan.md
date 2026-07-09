# Backend Security Session Plan

## Purpose

This file breaks the backend protection project into implementation sessions that can be completed safely without destabilizing the frontend.

## Delivery Strategy

We will build this in small deployable slices.

Every session must end with:

- code compiles
- current frontend paths still work
- new logic is behind compatibility flags when needed
- the new behavior is observable in logs or UI

## Session 1. Audit and Design Lock

### Goal

Freeze the exact route inventory and trust model before writing core protection logic.

### Tasks

- enumerate all backend routes under `backend/src/app/api`
- mark each route as:
  - public
  - authenticated
  - internal signed
  - admin
- identify expensive routes using AI or write-heavy DB operations
- identify routes currently used directly by browser fetches
- identify routes that can stay behind rewrites for now
- identify routes that must migrate to signed frontend proxies
- define route groups for policy management

### Deliverables

- route matrix document
- list of risky public routes
- migration list for frontend proxy adoption

### Success Criteria

- we know exactly which routes must be protected first
- no code behavior changes yet

## Session 2. Backend Security Core

### Goal

Introduce reusable backend security primitives without enforcing them harshly yet.

### Tasks

- add a backend security module folder
- create shared helpers:
  - `getClientIp()`
  - `getOrigin()`
  - `isAllowedOrigin()`
  - `buildMaintenanceResponse()`
  - `verifyHmacSignature()`
  - `assertTimestampFresh()`
  - `assertNonceUnused()`
  - `requireAdmin()`
  - `applyRateLimit()`
- define route group names
- create route policy resolver
- add audit log writer
- add passive logging for denied and accepted decisions

### Deliverables

- centralized security library
- no frontend changes required yet

### Success Criteria

- security checks exist as reusable functions
- backend still behaves compatibly

## Session 3. Runtime Config Tables

### Goal

Create runtime-controlled security settings so dashboard actions do not require redeploy.

### Tasks

- add database schema for:
  - `security_settings`
  - `allowed_origins`
  - `route_security_policies`
  - `rate_limit_policies`
  - `security_audit_logs`
  - `admin_users` or `user_roles`
- seed default records
- add backend readers with caching
- define fallback behavior when config is missing

### Deliverables

- database migration files
- server-side config access layer

### Success Criteria

- backend can read dynamic security settings
- safe defaults exist

## Session 4. Admin Auth and Admin Area Skeleton

### Goal

Create the protected admin surface before adding powerful controls.

### Tasks

- add admin role check in backend
- create frontend admin route
- add guarded admin layout
- add basic dashboard shell
- show:
  - current backend status
  - current maintenance status
  - current allowed origins count
  - current rate limit policy count

### Deliverables

- protected admin area
- role-based backend validation

### Success Criteria

- only admins can access admin dashboard
- dashboard loads read-only operational data

## Session 5. Maintenance Mode End-to-End

### Goal

Implement the `Close Server` and `Enable Server` flow without breaking the app.

### Tasks

- add admin action to toggle backend enabled state
- implement backend maintenance guard
- return:
  - `503 Service Unavailable`
  - JSON code `SERVER_DISABLED`
  - retry metadata
- create frontend global maintenance store
- create frontend maintenance UI
- intercept backend maintenance responses centrally
- show styled message:
  - `Сайт временно не работает`
- restore normal app after re-enable

### Deliverables

- admin toggle for backend state
- backend maintenance response contract
- frontend maintenance screen

### Success Criteria

- clicking `Close Server` disables normal API behavior
- frontend shows maintenance screen instead of random errors
- clicking `Enable Server` restores normal operation

## Session 6. Allowed Origins and Browser Guard

### Goal

Reduce casual abuse from unauthorized browser origins.

### Tasks

- implement allowlist origin validation
- support:
  - production frontend domain
  - preview domains
  - local dev origins
- add admin UI for viewing and editing origins
- allow disabling origin checks per route group if needed during migration

### Deliverables

- backend origin protection
- admin-managed origin list

### Success Criteria

- unauthorized browser-origin requests are rejected on protected routes
- normal frontend still works

## Session 7. HMAC Signing Foundation

### Goal

Add secure request signing for internal trusted traffic.

### Tasks

- design canonical string format
- add server-only frontend signing helper
- add backend HMAC verification helper
- add timestamp window validation
- add nonce replay storage
- add key id support
- add audit logs for failed signature checks

### Deliverables

- shared signing specification
- backend verification implementation
- frontend server-side signer

### Success Criteria

- signed requests can be generated and verified successfully
- replayed or stale requests are rejected

## Session 8. Signed Frontend Proxy Migration

### Goal

Move sensitive browser-to-backend flows through trusted frontend server handlers.

### Tasks

- create frontend route handlers for selected sensitive actions
- move browser calls from direct backend proxy paths to frontend internal handlers
- start with:
  - recommendations
  - analyze
  - generate-plan
  - coach chat if needed
- keep request and response payloads frontend-compatible
- preserve UI contract so existing pages do not need wide rewrites

### Deliverables

- signed frontend proxy routes
- browser clients no longer call sensitive backend endpoints directly

### Success Criteria

- frontend pages still behave the same
- backend sees signed trusted traffic

## Session 9. Strict HMAC Enforcement

### Goal

Turn on hard blocking for sensitive route groups after frontend migration is stable.

### Tasks

- enable `require_hmac=true` for selected route groups
- keep compatibility mode off only after verifying frontend traffic
- deny unsigned requests to protected sensitive endpoints
- observe logs for false positives

### Deliverables

- real internal-route protection

### Success Criteria

- copied backend URL alone is no longer enough to access protected routes

## Session 10. Rate Limiting Engine

### Goal

Protect backend cost and stability against abuse.

### Tasks

- add Redis-backed counters and nonce store
- implement route-group policy evaluation
- apply limits by:
  - IP
  - user id
  - key id
- return consistent `429` responses
- log rate limit hits

### Deliverables

- centralized rate limit engine

### Success Criteria

- burst abuse is blocked
- normal traffic remains healthy

## Session 11. Rate Limit Dashboard Controls

### Goal

Make rate limits adjustable from admin dashboard.

### Tasks

- add rate limit policy editor UI
- add enable/disable toggles
- add per-route-group mapping UI
- show recent 429 metrics

### Deliverables

- admin control for rate limits

### Success Criteria

- admin can tighten or relax limits without redeploy

## Session 12. Audit, Monitoring, and Hardening

### Goal

Make the system observable and production-safe.

### Tasks

- add audit views in dashboard
- show:
  - maintenance toggles
  - denied origin attempts
  - failed HMAC attempts
  - rate limit hits
  - admin changes
- add key rotation support
- add emergency disable for expensive route groups
- add documentation for operations

### Deliverables

- admin observability tools
- hardened production controls

### Success Criteria

- admin can understand what the security layer is doing
- operations are manageable without code edits

## Work Rules for Each Session

### Rule 1

Do not hard-enforce HMAC before the matching frontend proxy is deployed.

### Rule 2

Do not use browser-side secrets.

### Rule 3

Do not change response payload shape for existing frontend pages unless a compatibility adapter is added.

### Rule 4

Introduce a shared frontend fetch/proxy layer before large-scale route migration.

### Rule 5

Roll out maintenance mode before strict blocking so the frontend learns how to render controlled outage states.

## Suggested Session Batches

If we want to deliver this in larger chunks:

### Batch A

Sessions 1 to 4

Outcome:

- route map
- security core
- runtime config tables
- admin dashboard skeleton

### Batch B

Sessions 5 to 8

Outcome:

- maintenance mode
- origin protection
- HMAC foundation
- signed frontend proxy migration

### Batch C

Sessions 9 to 12

Outcome:

- strict enforcement
- rate limit controls
- audit and production hardening

## Recommended First Implementation Order

If we begin coding next, the safest start is:

1. Session 1
2. Session 2
3. Session 3
4. Session 5

This sequence gives us:

- security structure
- runtime control storage
- the server shutdown feature you care about most
- a frontend-safe maintenance flow before heavy enforcement
