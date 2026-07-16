# Session 02: Authentication and Lifecycle

## Goal

Support secure mobile authentication while preserving the existing web cookie flow.

## Preconditions

- Session 01 gate passed.
- Current backend cookie auth path has tests/baseline evidence.
- Supabase mobile redirect configuration is available for development.

## Scope

- Add shared auth DTO/error contracts.
- Implement backend identity resolution for valid Bearer tokens and existing cookies.
- Add one protected versioned endpoint used as the cross-client auth proof.
- Configure Supabase React Native client and secure session adapter.
- Implement email/password sign in, sign up if in product scope, session restore and logout.
- Add AppState-driven token refresh behavior.
- Configure Google OAuth deep-link return.
- Define guest device/session identity and a future merge contract; implement merge only if required by this session's chosen proof.
- Ensure logout/account switch clears user-scoped local state.

## Verification

- Protected endpoint succeeds with mobile Bearer token.
- The same or equivalent protected web flow still succeeds with cookies.
- Wrong/expired token returns typed `401`.
- Sign in survives force stop and cold relaunch.
- Background/foreground refresh works.
- Logout removes secure session and protected calls fail afterward.
- Google OAuth returns to the intended screen in a development build.

## Gate

Session 02 passes only after real process restart and OAuth/deep-link evidence, not after unit tests alone.

## Do not

- Store tokens in SQLite/plain AsyncStorage.
- Trust client user ids.
- replace the web cookie flow with mobile-only auth.
- mark Sign in with Apple complete; its final gate belongs to Session 10.
