# Session 08: Offline, Notifications and Native Integrations

## Goal

Harden offline behavior and add high-value native capabilities without changing core product ownership.

## Preconditions

- Sessions 01-07 gates passed.
- Local schema/outbox behavior is stable.
- Notification use cases and consent text are approved.

## Scope

- Audit all cached entities, freshness and cleanup rules.
- Complete offline/read-only UX for plan, roadmap, profile snapshot and drafts.
- Add connectivity recovery and controlled outbox processing.
- Register push tokens per user/device with revoke/rotation handling.
- Add Coach reminder and community message notification types.
- Implement deep links for goal, plan, Coach task and conversation.
- Add haptics/share sheet where they materially improve UX.
- Add optional biometric re-unlock without using it as auth truth.
- Finalize permission education, deny and settings fallback paths.

## Verification

- Run core cached flows in airplane mode.
- Queue safe mutations offline, reconnect and verify one server result.
- Receive notification foreground/background/terminated and navigate correctly.
- Log out/account switch and verify token registration/local rows are cleaned.
- Test invalid/expired deep links.
- Verify denied notifications/biometrics do not block core use.

## Gate

Session 08 passes when offline boundaries are truthful, safe mutations sync once, and push/deep links work across app lifecycle states.

## Do not

- claim offline AI.
- use background work as guaranteed real-time execution.
- send sensitive content in notification payloads without explicit policy.
- make permissions mandatory for the core flow.
