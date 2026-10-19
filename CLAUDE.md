# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building
- `pnpm run react:build-all` - Builds the react-family packages (core, react-js, react-native, expo) in dependency order
- Individual package builds: `pnpm --filter @sublay/[package-name] run build`
- Each package builds to ESM and CJS formats using TypeScript

### Publishing
Scripts are grouped by publish group, and every group carries a `{group}:` prefix — no group is the unprefixed default. There are five groups: `react`, `ui-core`, `cli`, `node`, `js`.

**Always use a bump-and-publish form: `:patch` / `:minor` for production, `:prerelease` for beta.** The bare `{group}:publish-prod` / `{group}:publish-beta` scripts build (and, for `react`/`node`/`js`, run tests) and then publish — but they never bump the version, and `pnpm publish` silently skips any package whose current version is already on the registry, exiting 0. So running a bare form without having bumped the version separately first *looks* like a successful release and ships nothing. `{group}:publish-prod:{patch,minor}` is `{group}:version:{patch,minor} && {group}:publish-prod`; `{group}:publish-beta:prerelease` (react, node and js only, from the `v8` branch only) is `{group}:version:prerelease && {group}:publish-beta`. Beta has no `:patch` / `:minor` — on a beta version they would produce a full release. Reach for a bare form only when you have deliberately bumped the version by hand as a separate step.

| Group | Packages | Publish |
|---|---|---|
| `react` | `@sublay/core`, `@sublay/react-js`, `@sublay/react-native`, `@sublay/expo` | `pnpm run react:publish-prod:patch` / `react:publish-prod:minor` (beta: `react:publish-beta:prerelease`, from the `v8` branch only) |
| `ui-core` | `@sublay/ui-core-react-js`, `@sublay/ui-core-react-native` | `pnpm run ui-core:publish-prod:patch` / `:minor` (no beta channel) |
| `cli` | `@sublay/cli` | `pnpm run cli:publish-prod:patch` / `:minor` (no beta channel) |
| `node` | `@sublay/node` | `pnpm run node:publish-prod:patch` / `:minor` (beta: `node:publish-beta:prerelease`, from the `v8` branch only) |
| `js` | `@sublay/js` | `pnpm run js:publish-prod:patch` / `:minor` (beta: `js:publish-beta:prerelease`, from the `v8` branch only) |

Every group also exposes `{group}:version:patch` and `{group}:version:minor` for bumping without publishing.

**One-time setup per clone: `git config core.hooksPath .githooks`.** It enables `.githooks/pre-push`, which refuses a push to `main` whose react/node/js packages are at 8.x — v8 work reaches `main` only at graduation. Pull requests are covered separately by the required "No v8 into main" check (`.github/workflows/v8-guard.yml`), which also runs on every push to `main` as an alarm. Deliberate override: `git push --no-verify`.

### The `v8` branch

v8 (the next major API version) is in beta development on a long-lived **`v8` branch**. Full plan: `plan-v8-beta.md` at the engine root; scope is GitHub issues labelled `v8`.

- **Why `v8-<slice>` and not `v8/<slice>`:** git can't hold a branch `v8` and branches under `v8/` at the same time, because a ref can't be both a file and a directory.
- **What goes on `v8`:** v8 SDK changes *and* v8 docs (`docs/v8/`), together in the same slice. v8 work never targets `main`.
- **Slices:** branch from `v8` as `v8-<slice>` (e.g. `v8-docs-fork`), open the PR **into `v8`** — GitHub defaults a new PR's base to `main`, so set it explicitly. A slice cut from `v8` carries the react/node/js packages at 8.x, so the required "No v8 into main" check blocks it from `main` whatever it is called.
- **What stays on `main`:** ordinary 7.x SDK work and releases, cli and ui-core (never 8.x, no beta channel), registry changes that work with the current 7.x SDKs, and v7 docs fixes (`docs/v7/`). A v7 docs fix that also applies to `docs/v8/` must be mirrored there by hand on `v8`.
- **Registry components that depend on v8 go on `v8`.** A plain `sublay add` reads the registry from `main` (see below), so a component change made on `v8` reaches default installs at graduation; on `main` it would go live immediately and break for anyone still on the 7.x SDKs. v8 components are installed with `sublay add <component> --ref v8`, which reads the manifest, the files and the shared pieces from the `v8` branch. A component changed on `v8` must declare the v8 SDK in its `registry.json` dependencies (`@sublay/react-js@^8.0.0-beta.0`, etc.); `main` keeps `^7.0.0`. The dependency check after an install compares `@sublay/*` versions, so a project on the 7.x SDK that adds a v8 component is offered the 8.x SDK.
- **Testing v8 components before graduation:** in a `v8` checkout, run the CLI or `playground/` — without `--ref` both read the repo's own `registry/` folder before the remote URL. In any other app, run `npx @sublay/cli add <component> --ref v8`; `--ref` takes any pushed branch, so an unmerged slice works too (`--ref v8-<slice>`; raw.githubusercontent.com caches for about five minutes after a push). The offered SDK version has to be on npm for the install step to succeed. cli still has no beta channel: `--ref` is an option of the one CLI released from `main`, and `check-registry-integrity.mjs` requires the default ref to be `main`.
- **Keeping `v8` current — sync after each v7 change, never as routine.** When a change lands on `main` (a v7 SDK fix, a v7 docs fix, tooling), merge `main` into `v8` (merge, never rebase — `v8` is shared) in a `v8-sync-main` branch PR'd into `v8`, and **in that same PR adapt anything that should differ in v8**. Why: git silently takes a change from whichever side touched a line, so a v7-only fix (e.g. unwrapping v7's `{ comment }` response in `@sublay/js`) would otherwise ride into `v8` unnoticed — now, or at graduation. Adapting it on `v8` right after the sync makes `v8` the side that last changed those lines, so graduation keeps the v8 version. The merge conflicts on the react/node/js `package.json` `version` fields whenever `main` bumped them — **keep `v8`'s version** (8.x prerelease).
- **Graduation** is when `v8` merges into `main`; until then, nothing on `v8` reaches `main` or the npm `latest` tag.

**Always publish with `pnpm` from the workspace root (the `{group}:publish-*` scripts) — never `npm publish` from inside a package directory.** `@sublay/react-js`, `@sublay/react-native`, and `@sublay/expo` each declare `"@sublay/core": "workspace:*"` in real `dependencies`; `pnpm publish` rewrites that to the concrete version at pack time, while `npm pack`/`npm publish` ship the literal `"workspace:*"` string, producing a tarball no consumer can install.

`@sublay/cli` fetches components from `https://raw.githubusercontent.com/sublay-io/monorepo/<ref>/registry/...`. The default ref is `main`: it is the `REMOTE_REGISTRY_BASE` string literal in `packages/cli/src/utils/registry.ts`, so `registry/` has to exist on `main` for a plain `sublay add` to work. `sublay add <component> --ref <branch>` reads another branch; its base is derived from that literal by swapping the ref segment. Keep the declaration a plain `const REMOTE_REGISTRY_BASE = '<url>'` literal naming `main`: `.github/scripts/check-registry-integrity.mjs` regex-reads it and fails if the ref is anything else. The same script verifies the default URL actually resolves — but only on a GitHub Actions `push` build of `main` (silent elsewhere, since a branch's content isn't on `main` yet).

## Architecture Overview

This is the **monorepo** for Sublay — pre-modeled backend infrastructure for user-powered products (comments, votes, notifications, feeds, chat, and more). It holds every published SDK, the CLI + component registry, and the docs site as one pnpm workspace. The project follows a layered architecture:

### Core Architecture Layers

1. **API Foundation** - All functionality is accessible through REST APIs
2. **Libraries & SDKs** - TypeScript libraries that wrap the API with hooks and utilities
3. **UI Components** - Ready-to-use React/React Native components built on the libraries

### Package Structure

The monorepo is organized into 9 published packages across 5 groups, plus `registry/`, `playground/`, and `docs/` as non-publishable workspace members:

- **`@sublay/core`** - Core hooks, context providers, and utilities for both React and React Native
- **`@sublay/react-js`** - React-specific implementations and re-exports from core
- **`@sublay/react-native`** - React Native-specific implementations with token management
- **`@sublay/expo`** - Expo-specific implementations with secure token storage
- **`@sublay/ui-core-react-js`** / **`@sublay/ui-core-react-native`** - presentational UI components (see below)
- **`@sublay/node`** - server-side SDK (see below)
- **`@sublay/js`** - framework-agnostic browser SDK (see below)
- **`@sublay/cli`** - component installer (see below)

### Key Context Providers

The framework uses React Context for state management:
- `SublayProvider` - Root provider with project configuration
- `EntityProvider` - Manages individual entities (posts, articles, etc.)
- `EntityListProvider` - Manages collections of entities with filtering/sorting
- `CommentSectionProvider` - Manages comment threads and interactions
- `AuthProvider` - Handles authentication state
- `ListsProvider` - Manages user-created lists and collections

### Development Patterns

- **Workspace Dependencies**: Packages use `workspace:*` for internal dependencies
- **Build Process**: Each package compiles to both ESM (`dist/esm`) and CJS (`dist/cjs`) formats
- **TypeScript**: All packages use TypeScript with separate configs for ESM/CJS builds
- **Context-Hook Pattern**: UI components get state through context providers and custom hooks
- **Platform Abstraction**: Shared core logic with platform-specific implementations

### Usage Flow

1. Wrap app in `SublayProvider` with project ID and authentication token
2. Use `EntityProvider` to define the content being discussed
3. Add social components like `SocialCommentSection` which self-contain all UI and logic
4. Components automatically handle API calls, state management, and real-time updates

All social features (comments, votes, follows, lists, notifications) follow this same provider + hooks + components pattern.

## `@sublay/ui-core-react-js` / `@sublay/ui-core-react-native`

Presentational components the CLI registry imports: `GiphyContainer` (Giphy picker), `UserAvatar`, `Modal`, `FromNow` (relative time), `EmojiSuggestions`, `InfiniteScrollTrigger`, `Skeleton`. Both packages compile via the same dual ESM+CJS `tsc` pattern as the react family above (`tsconfig.esm.json` / `tsconfig.cjs.json`).

- `ui-core-react-js` depends on `@giphy/js-fetch-api` + `@giphy/react-components`; `ui-core-react-native` depends on `@giphy/js-fetch-api` + `expo-image` + `react-native-gesture-handler` + `react-native-svg`.
- Both peer on `@sublay/core` and `moment`. `ui-core-react-native` also peers on `react-native` (`>=0.83.0`, which forces React 19 in every stable release — its own `react` peer is narrowed to `^19.0.0` to match, not `^18||^19`).
- Unlike the react family, these are **not** linked to `@sublay/core` via `workspace:*` in `peerDependencies` (a peer can't use `workspace:*`) — only their own `devDependencies` use it for local building/testing.
- **Key Directories**: `packages/ui-core-react-js/src/components/`, `packages/ui-core-react-native/src/components/`

## Known duplication: response/model interfaces across packages

`core`, `node`, and `js` each keep their own hand-copied TypeScript interfaces for server response shapes (e.g. `WorkspaceInvitation` lives separately in `packages/core/src/interfaces/models/Workspace.ts`, `packages/node/src/interfaces/Workspace.ts`, and `packages/js/src/interfaces/Workspace.ts` — not a shared file). This is a known, accepted tradeoff, not an oversight — the three packages target different runtimes/auth models and are published independently, so a shared interfaces package would add a coordination dependency between them for comparatively little payoff. It does mean a server response-shape change has to be hand-applied to every package that types it, and can drift if one copy is missed (as happened with `WorkspaceInvitation.invitedBy` before it was caught and fixed 2026-08-30).

**When fixing a stale type in one of these packages, check the other two for the same interface and fix them too — don't ask each time, just do it.** A future dedup (shared `@sublay/*-interfaces` package or similar) is a reasonable idea but out of scope for a routine bug fix; raise it separately if it's worth pursuing.

## `@sublay/node` and `@sublay/js`

Server-side (`node`, service-key auth) and framework-agnostic browser (`js`, user-token auth) SDKs. Each has its own detailed `CLAUDE.md` — [`packages/node/CLAUDE.md`](packages/node/CLAUDE.md) and [`packages/js/CLAUDE.md`](packages/js/CLAUDE.md) — covering their full module list, the `bindModule` pattern, and (for `js`) the two auth modes and refresh-token rotation. Read those directly rather than duplicating here; the short version:

- **`node`**: `SublayClient.init({ projectId, apiKey })`, 15 bound modules (entities, comments, users, spaces, chat, etc.), acts on behalf of any user via an explicit `userId`/`actingUserId` param since a service key has no implicit session user.
- **`js`**: `SublayClient.init({ projectId, initialTokens? | getToken? })`, 14 bound modules, authenticates as an end user via a bearer token — no explicit actor param, the server derives it from the token.
- Both build via `tsup` (CJS+ESM) plus a separate `build:types` (`tsc --noEmit`) whole-project type-check step — `build:types` emits nothing, it exists purely to catch errors in source files `tsup`'s entry-graph-only build never reaches.

## `@sublay/cli` and `registry/`

Shadcn-style component installer: copies full, working UI components into a user's own source tree as editable files, rather than an npm package they'd `import` from.

- **Commands**: `init` (detects platform/TypeScript, prompts for platform/style/install-path, writes `sublay.json`) and `add <component> [--ref <branch>]` (reads `sublay.json`, fetches the matching `registry.json` and the shared pieces it lists, downloads and transforms every file, then writes them plus a barrel `index.ts`). `add` fetches everything before it writes anything: a missing branch, component or file fails the command with exit code 1 and nothing written.
- **Entry**: `packages/cli/src/index.ts` (Commander.js). **Commands**: `src/commands/{init,add}.ts`. **Utilities**: `src/utils/registry.ts` (where the registry is read from, ref validation, manifest/file fetch, shared-piece resolution), `transform.ts` (rewrites `../files/` → `../components/`, `~shared/<platform>/<piece>` → a relative path into the component's `shared/` folder, and `@sublay/react-native` → `@sublay/expo` on the expo platform), `detect.ts` (platform/TypeScript detection), `dependencies.ts` (dependency check + optional auto-install: by package name, plus a version comparison for `@sublay/*` packages only, which offers an upgrade when the project's range sits entirely below the required one; installs with the project's package manager — npm, yarn, pnpm or bun, from the nearest `packageManager` field or lock file in a folder that has a `package.json`, searching upward so workspaces resolve — and on Expo through `npx expo install` with bare names, so Expo picks SDK-matched versions, adding `react-native-worklets` when it installs Reanimated on SDK 54+).
- **Registry structure**: `registry/{platform}/{component}/{style}/` (platform: `react` | `react-native`; style: `styled` | `tailwind`), each holding a `registry.json` manifest (dependencies, file list, optional `shared` list, optional `languages` and `frameworks` maps, optional `usage` — lines of example code `add` prints after installing instead of its generic import line, with `{importPath}` replaced by the install path — and `exports.mainComponent`) plus `files/`, `hooks/`, `utils/`, `context/` subdirectories. `frameworks` maps a framework to a file of the component that `add` installs in place of `utils/env.ts` (the file a component reads settings such as API keys from the app's environment with): `detectFramework` in `detect.ts` gives `next` / `cra` / `vite` / `other` on React from the project's `package.json`, and the platform itself (`expo`, `react-native`) otherwise; a framework that isn't listed gets `utils/env.ts` as it is. The integrity script checks every entry resolves to a file of the component, as it does for `languages`. `registryUrl` in every manifest names its own directory under `raw.githubusercontent.com/sublay-io/monorepo/main/registry/...`; the CLI builds download URLs from ref + platform/component/style, so `registryUrl` is an identity field the integrity script checks, not what is fetched.
- **Shared pieces**: files several components use live once per platform in `registry/shared/{react,react-native}/` (Expo uses `react-native`), described by that folder's `shared.json`: `platform`, and `pieces` keyed by kebab-case piece name, each with `files` (one file named after the piece), `requires` (other pieces it imports) and `dependencies` (third-party packages as `name@range`). A component file imports a piece as `~shared/<platform>/<piece>` and its `registry.json` lists the piece under `shared`; shared files import each other relatively (`./<piece>`), mirrored in `requires`. `add` installs the listed pieces and everything they require into `<component>/shared/` and merges their packages into the dependency check (one spec per package, the component's range winning). The format is recorded next to the `SharedManifest` type in `src/utils/registry.ts`, and `check-registry-integrity.mjs` enforces it.
- **Local vs. production registry**: without `--ref`, `registry.ts` tries the local `registry/` directory first (so changes are testable before publishing), falling back to the GitHub raw URL on `main` for real `npx` usage — this dual path is why `registry/` and `playground/` link `@sublay/*` packages via `workspace:*` rather than npm versions, so local edits are typechecked immediately. With `--ref`, the local directory is skipped and everything is read from that branch on GitHub.
- **`packages/cli`'s own test suite** (`src/**/*.test.ts`, vitest) covers the pure-logic modules (`transform`, `detect`, `registry`, `dependencies`) plus spawned-binary integration tests in `src/cli-integration.test.ts` for process-level behavior (TTY handling, `--version`, shared-piece installs, `--ref`, and a default install of every component in `registry/` compared with its manifest) — the only thing in CI that exercises the CLI's actual runtime behavior, not just its types. Those tests read `packages/cli/test-fixtures/registry/` through two undocumented, test-only environment variables: `SUBLAY_REGISTRY_LOCAL_PATH` (replaces the local `registry/` directory) and `SUBLAY_REGISTRY_BASE_URL` (replaces the remote base; served by a local HTTP server in the tests). The integrity script has its own fixture tests, `node --test .github/scripts/check-registry-integrity.test.mjs`.
- **Key Directories**: `packages/cli/src/`, `registry/`, `playground/` (manual Vite harness for eyeballing registry components against real built packages)

## `docs/`

Mintlify documentation site (MDX + a `docs.json` nav config). **Only `docs/v7/` is actively maintained** — `docs/` root files and non-v7 subdirectories are legacy/read-only reference, do not touch unless explicitly instructed. Full details in [`docs/CLAUDE.md`](docs/CLAUDE.md) (local dev server via `mint dev`, requires Node.js 19+ — note this is Mintlify's own CLI requirement, unrelated to this workspace's `>=22.13` engines floor).

- **Key Directories**: `docs/v7/{api-reference,sdk,hooks,components,data-models}/`
- Mintlify's dashboard is configured to build from this repo directly (`main` branch, `/docs` as the subdirectory path) — no separate deploy step needed beyond pushing to `main`.