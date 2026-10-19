# Sublay mobile playground

An Expo (SDK 57) app for trying the four Sublay mobile comment components on a
phone through Expo Go: threaded and social comments, each in its Tailwind
(NativeWind) and inline-styles ("styled") variant. It uses the same test
entities as the web playground (`playground-threaded-comments`,
`playground-social-comments`), so web and phone show the same comments.

It lives in the monorepo but is **not** part of the pnpm workspace: it needs
its own React / React Native versions and installs with npm. `metro.config.js`
keeps Metro to this folder, and `tsconfig.json` to this folder's types.

## Run

```bash
# once, in the monorepo root: the CLI build the components script uses
pnpm install
pnpm --filter @sublay/cli build

# in this folder
npm install
cp .env.example .env        # then fill it in (see below)
npm run components          # installs the four variants from ../../registry
npx expo start --port 8091 --clear
```

Scan the QR code with Expo Go (SDK 57). Ports 8081 and 8090 are taken by other
projects.

At the top of the screen: Section (Threaded / Social), Style (Tailwind /
Styled), Theme (Light / Dark), and "Sign in as random user" / "Sign out".
Signed out, the components are read-only.

## The components

`components/` is not committed. `npm run components` (scripts/install-components.mjs)
runs this monorepo's CLI build against this checkout's `registry/`, the way
`sublay add` installs them, into `components/tailwind/` and
`components/styled/` (it switches `sublay.json` between the two and restores
it). It deletes each component's folder before installing it again, so run it
after any registry change: files the registry renamed or removed don't linger.

To install from GitHub instead of this checkout, as a developer would:

```bash
npx @sublay/cli@latest add <comments-threaded|comments-social> --ref v8
```

with `sublay.json`'s `"style"` and `"paths.components"` set to the variant.
`--ref v8` reads the components from the registry's `v8` branch; without it you
get the `main` (7.x) components, which don't work with `@sublay/expo` 8.

## The SDK

`@sublay/expo` comes from npm (`beta`). To try unpublished SDK changes, build
and pack the packages in the monorepo and point this app at the tarballs:

```bash
# monorepo root
pnpm run react:build-all
(cd packages/core && pnpm pack --pack-destination ../../playground/mobile)
(cd packages/expo && pnpm pack --pack-destination ../../playground/mobile)
```

Then in `package.json` set `"@sublay/expo"` and `"@sublay/core"` to
`file:<tarball>`, add `"overrides": { "@sublay/core": "$@sublay/core" }`, and
`npm install`. Tarballs are gitignored; put the published versions back when
done.

## Environment

`.env` (gitignored; `.env.example` lists the keys) holds a **test project's**
credentials:

```
EXPO_PUBLIC_SUBLAY_PROJECT_ID=...
EXPO_PUBLIC_SUBLAY_PRIVATE_KEY=...
# optional: GIF picker. Without it the components show a dev alert.
# EXPO_PUBLIC_GIPHY_API_KEY=...
```

The private key signs test-user JWTs through `useSignTestingJwt`. Because it is
`EXPO_PUBLIC_`, it is inlined into the JS bundle: keep this app local, and never
use a production project's key here.

## Setup it already has

`@sublay/expo` with its Expo modules (`expo-secure-store`, `expo-linking`,
`expo-web-browser`, `expo-notifications`), NativeWind (`babel.config.js`,
`metro.config.js`, `global.css` imported in `App.tsx`, `nativewind-env.d.ts`,
`tailwind.config.js` covering `./App.tsx` and `./components/**`), Reanimated
with `react-native-worklets`, gesture handler (`GestureHandlerRootView` in
`App.tsx`), `react-native-svg` and `@gorhom/bottom-sheet`.

## Checks

```bash
npx tsc --noEmit
npx expo export --platform ios     # then delete dist/
npx expo export --platform android
npx expo-doctor
```
