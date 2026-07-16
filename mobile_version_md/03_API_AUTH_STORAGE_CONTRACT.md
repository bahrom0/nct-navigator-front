# API, Authentication and Storage Contract

## API facade

Introduce a stable versioned facade such as `/api/v1/*` incrementally. Existing web routes may remain during migration. New handlers must call existing domain services rather than copy their logic.

Every response should include a stable status and request identifier. Errors need a machine-readable code separate from display text.

Example error envelope:

```json
{
  "status": "error",
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required",
    "retryable": false
  },
  "requestId": "req_...",
  "data": null
}
```

Do not expose raw provider errors or secrets to the client.

## Authentication

Backend request identity must resolve in this order without weakening validation:

1. Valid `Authorization: Bearer <Supabase access token>` for mobile.
2. Existing valid Supabase cookie session for web.
3. Explicit guest/device context only on routes that allow guests.

Requirements:

- Validate the token server-side and derive user identity from validated claims/user lookup.
- Never trust a client-supplied user id.
- Preserve existing cookie refresh behavior for web.
- Mobile session refresh follows app foreground/background lifecycle.
- Store short auth values in SecureStore; do not place them in SQLite logs or analytics.
- Google OAuth returns through configured deep/app links.
- iOS release scope includes Sign in with Apple or documented rule exemption.
- Account deletion, logout and account switch clear server/local state according to policy.

## Environments

Mobile uses explicit development, preview/staging and production configurations:

- API base URL;
- Supabase public URL/key;
- deep-link scheme and associated domains;
- application id/bundle id suffixes;
- telemetry environment.

Only public client configuration belongs in the bundle. Secrets remain on backend/CI.

## Persistence layers

### SecureStore

Use for:

- access/refresh session material as required by the auth adapter;
- short device-bound secrets;
- optional biometric unlock metadata that is not the auth source of truth.

Do not use as a general database or store large profiles.

### SQLite

Use versioned tables for:

- onboarding drafts;
- cached profile and active goal snapshots;
- recommendation result snapshots with version/timestamp;
- plan/roadmap/daily-plan cache;
- conversation/message cache;
- mutation outbox;
- sync metadata.

Every table needs migration strategy, ownership, timestamps and cleanup rules.

### Zustand

Use for current UI/session orchestration. Repositories hydrate stores asynchronously. Store definitions must not perform uncontrolled disk/network work at module import.

## Sync and idempotency

- Retried create/update requests carry an idempotency key where duplicates are harmful.
- Outbox items have stable client ids, attempt count, last error and next retry time.
- Server acknowledgements map client ids to canonical server ids.
- Conflict rules are per entity; do not use a universal last-write-wins rule without evidence.
- Cache timestamps are not proof of server freshness; use version/etag where available.

## Streaming and realtime

Recommendation progress may continue using newline-delimited JSON through `expo/fetch` and `ReadableStream` if runtime verification passes.

Each stream defines:

- event schema;
- terminal result/error event;
- cancellation behavior;
- background behavior;
- reconnection/resume policy;
- duplicate-event handling;
- authentication method.

Realtime chat must not depend on an in-memory connection manager if backend deployment can route related work to different instances. Use a durable transport or provide a safe polling fallback until durability is proven.

## Maintenance and network states

The typed API client centrally handles:

- offline/network unavailable;
- request timeout;
- `401` session refresh or sign-out;
- `403` permission denial;
- `409` conflict;
- `429` backoff;
- `503 SERVER_DISABLED` maintenance state;
- retryable `5xx` errors;
- request cancellation.

UI consumes typed states. It must not parse arbitrary backend strings to decide navigation.
