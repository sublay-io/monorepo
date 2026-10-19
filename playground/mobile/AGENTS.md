# Sublay mobile playground — notes for agents

An Expo (SDK 57) test app for the Sublay mobile comment components, run in
Expo Go. See README.md for running it.

- Plain Expo app: `index.ts` registers `App.tsx`. No Expo Router, no `src/app/`.
- Not part of the monorepo's pnpm workspace: install with `npx expo install`
  (npm), never pnpm. Don't let Metro or TypeScript reach the monorepo's
  node_modules (see metro.config.js, tsconfig.json).
- `components/` is generated and gitignored: change components in the
  monorepo's `registry/`, then `npm run components`. Don't edit
  `components/` and don't commit it.
- `.env` holds a test project's credentials and is gitignored.
- Expo changes between SDKs: check the versioned docs for SDK 57
  (https://docs.expo.dev/versions/v57.0.0/) rather than memory.
- Checks: `npx tsc --noEmit`, `npx expo export --platform android`,
  `npx expo-doctor`.
