# Playground

A manual Vite harness for eyeballing the registry components (`../registry/react/`) against the locally built `@sublay/*` packages. Not published, not deployed.

## Setup

1. From the repo root, install and build the packages the playground imports (it reads their `dist/`, so rebuild after changing a package):
   ```
   pnpm install
   pnpm react:build-all
   ```
2. `cp .env.example .env` and fill it in:
   - `VITE_PROJECT_ID` — the Sublay project to read from and write to.
   - `VITE_PRIVATE_KEY` — that project's JWT private key. `useSignTestingJwt` signs tokens for the mock users with it. Without it the playground is read-only.
   - `VITE_API_BASE_URL` — optional, see below.
3. `pnpm dev` (from this directory) and open the URL Vite prints.

`.env` is git-ignored. Use a throwaway project: everything you post here is real data in that project.

## Production vs. a local server

At startup Vite prints which API the playground talks to:

```
[playground] API base: https://api.sublay.io/v8  (production; set VITE_API_BASE_URL to override)
```

**Production** — leave `VITE_API_BASE_URL` empty.

**Local server** —

1. In `server/`: `PORT=5001 pnpm dev` (macOS AirPlay holds port 5000).
2. In `.env`: `VITE_API_BASE_URL=http://localhost:5001/v8`
3. Restart `pnpm dev`. The variable is read when Vite starts, so a running dev server does not pick up a change.

The project id and private key must belong to a project that exists on the server you point at.

How it works: the SDK hardcodes `https://api.sublay.io/v8`. A small plugin in `vite.config.ts` rewrites that literal (and the bare origin used for the socket connection) in the workspace SDK `dist` files as Vite serves or bundles them. It covers REST calls, the chat socket and the OAuth base, in both `pnpm dev` and `pnpm build`. Nothing under `packages/` changes.

The override never falls back to production silently. With `VITE_API_BASE_URL` set, `pnpm dev` and `pnpm build` stop with an error if the production URL isn't found in the SDK `dist` files (the SDK isn't built, or its base URL moved), and `pnpm build` also stops if it rewrote no module.

## Highlighting a comment

Both comment pages have a "Highlight comment id" input. Apply passes the id to the component as `highlightedCommentId`; Clear removes it. The id is kept in the URL as `?highlight=<id>`, so a reload or a pasted link opens the same deep-link view.

To get an id, copy one from the Network tab (the `GET /comments` response).

## Passing the entity

Both comment pages have a "Pass foreignId" / "Pass entity object" switch. Either way the section sits inside an `EntityProvider`. With "Pass entity object" the component gets `entity={entity}` from `useEntity()` instead of the `foreignId`; that object is replaced whenever the entity changes (posting a comment updates its `commentsCount`). The choice is kept in the URL as `?entity=object`.

## States to eyeball

Check each in both the styled and tailwind variants, light and dark.

Threaded and social:

- [ ] Nested replies — reply to a reply several levels deep; indentation and reply counts hold up.
- [ ] Load more — enough top-level comments and enough replies under one comment to page.
- [ ] Continue thread — nest past the depth limit and follow the "continue thread" link.
- [ ] `[deleted]` — delete a comment that has replies; the placeholder stays and the replies remain.
- [ ] `[removed]` with the "Removed by a moderator" note — remove a comment from the dashboard's moderation page, then reload.
- [ ] Focused deep-link view — apply a highlight id for a deeply nested comment; the focused thread shows with the comment highlighted, and "View all comments" returns to the full list.
- [ ] Error and retry — set devtools to Offline, trigger a load (reload, load more, expand replies), confirm the error state, go back online and retry.
- [ ] Entity object — switch to "Pass entity object", expand a reply thread, type a reply without sending it, then post a top-level comment. The thread stays expanded, the draft stays, and the list isn't fetched again.
- [ ] Blocked / unavailable rows — needs two users and a block created through the API: user A comments, user B blocks A, then view the thread as B.

Social only:

- [ ] Top by likes — like a few comments from different mock users and confirm the Top order.
- [ ] Sort buttons — switch between the sort options; the list refetches and reorders.

Use "Randomize" in the mock-user bar to switch users.
