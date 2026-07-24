# Mobile Migration Baseline Results

- Date: 2026-07-16
- Planning baseline commit: `0cb0e5c Add mobile migration session plan`
- Branch: `main`
- Workspace: `C:\Users\bahro\Desktop\nct-navigator-front`

## Toolchain

- Node.js: `v22.16.0`
- npm: `10.9.2`
- Web: Next.js `16.2.7`, React `19.2.4`
- Android Studio: installed at `C:\Program Files\Android\Android Studio`
- Android SDK: `C:\Users\bahro\AppData\Local\Android\Sdk`
- `adb`: installed and starts successfully
- Connected Android devices: none
- Android Emulator binary: not installed in the detected SDK
- AVD/system images: not installed in the detected SDK
- `sdkmanager.bat`: not present in the detected command-line tools tree

The Session 01 runtime gate therefore requires installing/configuring Android Emulator plus one AVD, or connecting a physical Android device.

## Environment names found

Values were not printed or copied.

- Web: `BACKEND_ORIGIN`
- Backend: Supabase public URL/key, Supabase service-role key, AI provider/model/base URL/API key

Mobile must introduce only public `EXPO_PUBLIC_*` configuration and must not reuse backend secrets.

## Web build

Command:

```powershell
npm.cmd run build
```

Result: PASS.

- Compiled successfully.
- TypeScript passed.
- 25 static/dynamic pages generated.
- Core routes include onboarding, categories, recommendations, interview, plan, Coach, dashboard, chat and teacher.

## Backend build

Command:

```powershell
npm.cmd run build
```

Working directory: `backend/`.

Result: PASS with one known warning.

- Compiled successfully.
- TypeScript passed.
- API routes generated.
- Existing warning: Turbopack/NFT broad tracing from `src/app/api/setup-db/route.ts` through `next.config.ts`.

Do not attribute this warning to mobile changes unless its behavior changes.

## Live backend contract checks

The production build was temporarily started locally on `127.0.0.1:4010` and stopped after testing.

| Check | Result |
|---|---|
| `GET /api/system/status` | `200`, structured enabled/maintenance payload |
| `GET /api/auth/session` without cookie | `200`, `isAuthenticated: false`, `user: null` |
| `GET /api/sync-profile` without cookie | `401` |
| `POST /api/recommendations/stream` | `200`, `application/x-ndjson; charset=utf-8` |

Recommendation stream evidence:

- 4 stage events in canonical order;
- 1 terminal result event;
- real NCT candidates returned;
- diagnostics reported `wrongCity: 0`, `hardFilter: 0`, `unknownCode: 0`, `unknownProfessionKey: 0` for the exercised Dushanbe/after-11 technology case.

## Provisional mobile identifiers

These are development placeholders, not final store identity:

- app slug: `nct-navigator-mobile`
- deep-link scheme: `nctnavigator`
- Android application id: `com.nctnavigator.mobile`
- development suffix: `.dev`
- preview suffix: `.preview`

Reconfirm final organization-owned identifiers before signing/store setup.

## Provisional platform floor

Use the minimum supported by the stable Expo SDK selected during scaffold. Record the generated Android/iOS deployment settings after scaffold. Do not manually lower them without compatibility evidence.

## Session 00 gate

PASS for beginning Session 01:

- API inventory created;
- screen map created;
- web and backend builds recorded;
- required representative backend routes exercised;
- Android SDK/emulator state identified;
- environment and provisional identifier decisions recorded.
