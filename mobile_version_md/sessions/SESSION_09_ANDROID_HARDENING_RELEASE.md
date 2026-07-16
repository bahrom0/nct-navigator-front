# Session 09: Android Hardening and Release

## Goal

Produce a measured, signed Android release candidate and validate it through the Play internal track.

## Preconditions

- Functional sessions 01-08 passed.
- Production backend/config/privacy destinations exist.
- Signing material is managed outside git.

## Scope

- Finalize application id, versionCode/versionName and environment separation.
- Configure adaptive icon, splash, package metadata and permissions.
- Remove unused dependencies/assets and debug-only behavior.
- Profile cold/warm startup, rendering, memory and network behavior.
- Fix reproducible ANRs, frozen frames, list jank and excessive startup work.
- Validate process death, low memory, rotation if supported, keyboard and hardware Back.
- Add crash/performance telemetry with privacy-safe metadata.
- Produce internal APK and signed AAB.
- Upload to Play Internal Testing and execute the release checklist.
- Document rollback and staged rollout rules.

## Device matrix

- one lower-resource supported Android physical device;
- one current/representative physical device;
- compact and large emulator profiles;
- gesture and three-button navigation where practical.

## Verification

- Clean install, upgrade install and reinstall behavior.
- Cold launch and time-to-interactive measurements recorded.
- Core vertical slice, Coach, chat/media, notifications and deep links pass on release build.
- No debug endpoint/secret/logging leakage.
- Play internal AAB installs and authenticates against intended environment.
- Web/backend regression checks remain green.

## Gate

Session 09 passes only after the Play internal-track build is exercised on physical Android hardware and release evidence is recorded.

## Do not

- call a debug APK the production release.
- commit keystores or passwords.
- accept emulator-only performance evidence.
- widen rollout without crash/ANR monitoring and rollback readiness.
