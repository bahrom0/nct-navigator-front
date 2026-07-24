# NCT Navigator Mobile

Independent Expo SDK 57 / React Native application. It does not import the web UI and does not use a WebView.

## Local Android development on Windows

1. Start the existing backend on port `4010`.
2. Copy `.env.example` to `.env.local`. `10.0.2.2` reaches the Windows host from the standard Android emulator; a physical phone needs the computer's LAN IP.
3. Install dependencies with `npm install`.
4. Generate and launch a development build with `npm run android`.
5. Later launches can use `npm start` while the installed development client remains compatible.

Open the generated `mobile/android` folder in Android Studio when native inspection is required. It is intentionally gitignored and reproducible from `app.config.js` with `npm run prebuild:android`.

## Quality gates

```powershell
npm run lint
npm run typecheck
npm test
npm exec -- expo export --platform android
```

## Environments

- `APP_VARIANT=development|preview|production` controls the display name and application identifiers during native generation/build.
- `EXPO_PUBLIC_APP_ENV` and `EXPO_PUBLIC_API_BASE_URL` configure the public runtime client.
- Public variables are bundled into the app and must never contain secrets.
- Preview and production API hosts in the example files are deliberately invalid placeholders; replace them with approved HTTPS origins in the build environment.

Local iOS compilation still requires macOS/Xcode. The shared TypeScript client and Expo configuration are kept iOS-compatible from the start.
