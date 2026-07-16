# Session 10: iOS, TestFlight and Release

## Goal

Produce and validate an iOS release candidate through TestFlight and prepare App Store submission.

## Preconditions

- Session 09 and platform-neutral functional gates passed.
- Apple Developer/App Store Connect access and bundle identifiers are available.
- macOS/Xcode or approved EAS iOS build path is available.
- A real supported iPhone is available for final verification.

## Scope

- Finalize bundle id, build number, entitlements and associated domains.
- Implement/verify Sign in with Apple or document an applicable App Review exemption.
- Configure Google OAuth and all auth/reset deep links for iOS.
- Validate Keychain/session behavior across install/update/logout.
- Adapt navigation, keyboard, safe areas, sheets/actions and permission copy for iOS.
- Configure push certificates/keys and notification categories.
- Verify account deletion, privacy disclosures and data collection declarations.
- Profile with Xcode Instruments where needed.
- Build and distribute through TestFlight.
- Run internal/external tester matrix and prepare review notes.
- Define phased release and rollback response.

## Verification

- Clean install and upgrade on real iPhone.
- Email, Google and Apple auth paths.
- Cold/warm deep links from auth, notification and universal link.
- Process termination during stream/upload and safe recovery.
- Core vertical slice, Coach, chat/media, offline cache and notification behavior.
- Dynamic Type, VoiceOver, dark mode and reduced motion.
- TestFlight build uses production-like configuration with no secret leakage.

## Gate

Session 10 passes only after a TestFlight build completes the required matrix on a real iPhone and App Store compliance items are recorded.

## Do not

- close the gate using Android evidence.
- treat a successful cloud build as runtime verification.
- skip Sign in with Apple/app-review analysis when Google is a primary login.
- claim App Store readiness without privacy/account-deletion review.
