# Session 01: Native Foundation

## Goal

Create a real React Native development build that launches on Android and communicates with the backend through a typed client.

## Preconditions

- Session 00 gate passed.
- Android Studio SDK/emulator state is known.
- Application identifiers and dev API URL are recorded.

## Scope

- Create `mobile/` with stable Expo SDK and TypeScript.
- Configure Expo development build and Expo Router.
- Add development/preview/production public configuration validation.
- Create root error boundary, splash/bootstrap state, safe-area handling and basic theme tokens.
- Create placeholder native tabs without product screen implementation.
- Implement typed API client with timeout, cancellation and parsed error envelope.
- Call backend system status/maintenance endpoint.
- Add lint, typecheck and unit-test scripts.
- Configure Android debug build and documented launch command.

## Expected files

- `mobile/package.json`, config and lockfile changes
- `mobile/app/` native routes
- `mobile/src/api/`
- `mobile/src/config/`
- `mobile/src/theme/`
- `mobile/README.md` with Windows/Android Studio commands

## Verification

- Install development build on Android emulator or device.
- Cold launch shows native UI with no WebView.
- Dev backend health succeeds from the device/emulator.
- Backend-off state produces the typed maintenance UI.
- Invalid API base URL produces a controlled error, not a blank screen.
- Mobile typecheck/lint/tests pass.

## Gate

Session 01 passes when a fresh Android development build can be installed, cold-launched and can show live backend health/maintenance state.

## Do not

- Implement authentication beyond interfaces/placeholders.
- Copy web AppShell or Tailwind UI.
- Add SQLite schema beyond a minimal migration harness if needed for bootstrap proof.
- Add community, Coach or notification dependencies.
