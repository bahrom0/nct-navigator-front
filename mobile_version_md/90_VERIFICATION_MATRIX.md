# Mobile Verification Matrix

Update this matrix with evidence links/commands. `Pending` is the default; do not change to `Pass` without the required runtime proof.

| Area | Required evidence | Status |
|---|---|---|
| Web baseline | web build and canonical auth/core smoke test | Partial: build passed; native-session regression smoke remains |
| Backend baseline | backend build and representative route smoke test | Pass: `artifacts/baseline-results.md` |
| Native UI | cold launch with no core WebView | Pending |
| API configuration | dev/preview/prod validation and wrong-config failure | Pending |
| Maintenance | live `503 SERVER_DISABLED` and recovery | Pending |
| Bearer auth | protected call with valid/invalid/expired token | Pending |
| Web cookie regression | protected web flow after auth changes | Pending |
| Session lifecycle | foreground/background, force stop, relaunch, logout | Pending |
| OAuth deep link | cold/warm return from provider | Pending |
| Onboarding draft | process death restoration and reset | Pending |
| Recommendation stream | stages, result, cancel, network loss, retry | Pending |
| Goal idempotency | retry produces one active goal | Pending |
| Interview recovery | force stop and resume | Pending |
| Plan idempotency | retry produces one canonical plan | Pending |
| Coach continuity | same goal across roadmap/daily/chat/restart | Pending |
| Offline cache | truthful read-only content and stale state | Pending |
| Outbox | offline mutation syncs once | Pending |
| Community realtime | reconnect/order/no duplicates | Pending |
| Media | permission, validation, progress, cancel, retry | Pending |
| Push | foreground/background/terminated navigation | Pending |
| Accessibility | screen reader, font scale, contrast, reduced motion | Pending |
| Android performance | cold start, frames, memory, ANR evidence | Pending |
| Android release | Play internal AAB on physical device | Pending |
| iOS performance | Instruments/device evidence | Pending |
| iOS release | TestFlight build on physical iPhone | Pending |
| Privacy/security | no secrets, permissions, deletion and disclosure review | Pending |
| Rollback | tested/documented release rollback path | Pending |

## Evidence format

For each passed item record:

- date;
- commit/branch;
- environment;
- device/OS/build identifier;
- exact command or user flow;
- observed result;
- logs/screenshots/report path where applicable.
