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
- **Registry components that depend on v8 go on `v8`.** The CLI downloads components only from `main` (see below), so a component change made on `v8` isn't served to `sublay add` users until graduation. On `main` it would go live immediately and break for anyone still on the 7.x SDKs. A component changed on `v8` must declare the v8 SDK in its `registry.json` dependencies (`@sublay/react-js@^8.0.0-beta.0`, etc.); `main` keeps `^7.0.0`.
- **Testing v8 components before graduation:** run the CLI or `playground/` from a `v8` checkout, since both read the repo's own `registry/` folder before falling back to the remote URL. For dogfooding in other apps, copy the component files by hand. There's deliberately no beta CLI pointed at the `v8` branch: cli has no beta channel, and `check-registry-integrity.mjs` requires the served ref to be `main`.
- **Keeping `v8` current — sync after each v7 change, never as routine.** When a change lands on `main` (a v7 SDK fix, a v7 docs fix, tooling), merge `main` into `v8` (merge, never rebase — `v8` is shared) in a `v8-sync-main` branch PR'd into `v8`, and **in that same PR adapt anything that should differ in v8**. Why: git silently takes a change from whichever side touched a line, so a v7-only fix (e.g. unwrapping v7's `{ comment }` response in `@sublay/js`) would otherwise ride into `v8` unnoticed — now, or at graduation. Adapting it on `v8` right after the sync makes `v8` the side that last changed those lines, so graduation keeps the v8 version. The merge conflicts on the react/node/js `package.json` `version` fields whenever `main` bumped them — **keep `v8`'s version** (8.x prerelease).
- **Graduation** is when `v8` merges into `main`; until then, nothing on `v8` reaches `main` or the npm `latest` tag.

**Always publish with `pnpm` from the workspace root (the `{group}:publish-*` scripts) — never `npm publish` from inside a package directory.** `@sublay/react-js`, `@sublay/react-native`, and `@sublay/expo` each declare `"@sublay/core": "workspace:*"` in real `dependencies`; `pnpm publish` rewrites that to the concrete version at pack time, while `npm pack`/`npm publish` ship the literal `"workspace:*"` string, producing a tarball no consumer can install.

`@sublay/cli` fetches every component from `https://raw.githubusercontent.com/sublay-io/monorepo/main/registry/...` (hardcoded to `main` in `packages/cli/src/utils/registry.ts`), so `registry/` has to exist on `main` for a real `sublay add` to work. `.github/scripts/check-registry-integrity.mjs` verifies this URL actually resolves — but only on a GitHub Actions `push` build of `main` (silent elsewhere, since the URL can't resolve on a branch that isn't `main`).

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

- **Commands**: `init` (detects platform/TypeScript, prompts for platform/style/install-path, writes `sublay.json`) and `add <component>` (reads `sublay.json`, fetches the matching `registry.json`, downloads and transforms the component's files, writes a barrel `index.ts`).
- **Entry**: `packages/cli/src/index.ts` (Commander.js). **Commands**: `src/commands/{init,add}.ts`. **Utilities**: `src/utils/registry.ts` (fetch — local `registry/` first for development, GitHub raw URLs in production), `transform.ts` (rewrites `../files/` → `../components/`, and `@sublay/react-native` → `@sublay/expo` on the expo platform), `detect.ts` (platform/TypeScript detection), `dependencies.ts` (peer-dependency check + optional auto-install).
- **Registry structure**: `registry/{platform}/{component}/{style}/` (platform: `react` | `react-native`; style: `styled` | `tailwind`), each holding a `registry.json` manifest (dependencies, file list, `exports.mainComponent`) plus `files/`, `hooks/`, `utils/`, `context/` subdirectories. `registryUrl` in every manifest points at `raw.githubusercontent.com/sublay-io/monorepo/main/registry/...` — this only resolves once content is on `main` (see the registry-integrity note above).
- **Local vs. production registry**: `registry.ts` tries the local `registry/` directory first (so changes are testable before publishing), falling back to the GitHub raw URL for real `npx` usage — this dual path is why `registry/` and `playground/` link `@sublay/*` packages via `workspace:*` rather than npm versions, so local edits are typechecked immediately.
- **`packages/cli`'s own test suite** (`src/*.test.ts`, vitest) covers the pure-logic modules (`transform`, `detect`, dependency-name parsing) plus spawned-binary integration tests for process-level behavior (TTY handling, `--version`) — the only thing in CI that exercises the CLI's actual runtime behavior, not just its types.
- **Key Directories**: `packages/cli/src/`, `registry/`, `playground/` (manual Vite harness for eyeballing registry components against real built packages)

## `docs/`

Mintlify documentation site (MDX + a `docs.json` nav config). **Only `docs/v7/` is actively maintained** — `docs/` root files and non-v7 subdirectories are legacy/read-only reference, do not touch unless explicitly instructed. Full details in [`docs/CLAUDE.md`](docs/CLAUDE.md) (local dev server via `mint dev`, requires Node.js 19+ — note this is Mintlify's own CLI requirement, unrelated to this workspace's `>=22.13` engines floor).

- **Key Directories**: `docs/v7/{api-reference,sdk,hooks,components,data-models}/`
- Mintlify's dashboard is configured to build from this repo directly (`main` branch, `/docs` as the subdirectory path) — no separate deploy step needed beyond pushing to `main`.