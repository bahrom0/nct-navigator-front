# Session 07: Community Chat and Media

## Goal

Implement reliable native conversations, messages and media with server-enforced membership and mobile-safe realtime behavior.

## Preconditions

- Session 06 gate passed.
- Current chat membership, message and upload paths are traced.
- Realtime deployment topology is verified; do not assume in-memory SSE is horizontally durable.

## Scope

- Paginated and virtualized conversation/message lists.
- Stable client message ids, optimistic send and server acknowledgement.
- Message outbox with sending/sent/failed states.
- Realtime reconnect/backoff or documented polling fallback.
- Correct prepend pagination and scroll retention.
- Native image picker/camera flow after explicit user action.
- Media validation, compression/resize, progress, cancellation and retry.
- Reply, edit/delete and permissions only where backend already supports them.
- Deep-link target model for a conversation/message.

## Verification

- Send/receive messages between two real accounts.
- Lose/recover network and verify order/no duplicates.
- Force stop with an outbox item and verify safe recovery.
- Deny/allow media permission.
- Reject invalid/oversized media; upload valid media with progress and cancellation.
- Confirm unauthorized conversation/message/media access fails on backend.
- Validate behavior across backend instances or explicitly retain the polling fallback.

## Gate

Session 07 passes when text and media messaging remain correct through reconnect, restart and retry, with authorization enforced server-side.

## Do not

- Depend on UI-only membership checks.
- assume one backend instance.
- request camera/photo permissions on app launch.
- load all messages into memory.
