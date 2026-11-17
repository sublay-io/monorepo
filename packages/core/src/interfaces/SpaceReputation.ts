/**
 * Shared optional params for opting embedded/returned users into a
 * space-scoped reputation value (`spaceReputation`; see
 * {@link import("./models/User").UserFull}).
 *
 * The relationship is expressed as a single `spaceReputation` object —
 * `{ spaceId, includeDescendants? }` — because the two always travel together
 * and `includeDescendants` is only meaningful alongside an explicit `spaceId`.
 * The SDK sends it as the server's flat `spaceReputationId` /
 * `spaceReputationDescendants` params.
 *
 * Two variants exist because the server accepts a different value set per
 * endpoint class:
 * - {@link SpaceReputationContextParams} — context endpoints (entities,
 *   comments, chat, spaces team/members, search, reports). Accept
 *   `<uuid> | "none" | "context"`.
 * - {@link SpaceReputationUserParams} — user-direct endpoints (the `users`
 *   module). Accept `<uuid> | "none"` only; `"context"` is rejected (400).
 */

/**
 * The space-reputation object for context endpoints (entities, comments,
 * chat, spaces team/members, search, reports).
 */
export interface SpaceReputationContextObject {
  /**
   * Which space's reputation to attach to the returned/embedded user(s).
   * Accepted forms:
   * - a space `<uuid>` — reputation scoped to that specific space
   * - `"none"` — the user's global, non-space reputation
   * - `"context"` — reputation scoped to each row's own space (per-row)
   */
  spaceId: string | "none" | "context";
  /**
   * Include reputation accrued in descendant spaces. Only honored when
   * `spaceId` is an explicit `<uuid>`; ignored for `"none"` and disallowed
   * (not applicable) with `"context"`.
   */
  includeDescendants?: boolean;
}

/**
 * The space-reputation object for user-direct endpoints. Same as
 * {@link SpaceReputationContextObject} but `"context"` is rejected by the
 * server (400) on these routes — only a `<uuid>` or `"none"` is valid.
 */
export interface SpaceReputationUserObject {
  /**
   * Which space's reputation to attach to the returned user(s).
   * Accepted forms:
   * - a space `<uuid>` — reputation scoped to that specific space
   * - `"none"` — the user's global, non-space reputation
   *
   * Note: `"context"` is rejected by the server (400) on user-direct routes;
   * pass an explicit `<uuid>` or `"none"` here.
   */
  spaceId: string | "none";
  /**
   * Include reputation accrued in descendant spaces. Only honored when
   * `spaceId` is an explicit `<uuid>`; ignored for `"none"`.
   */
  includeDescendants?: boolean;
}

/**
 * Space-reputation params for endpoints whose controllers enrich users from
 * the *current request context* (entities, comments, chat, spaces
 * team/members, search, reports).
 */
export interface SpaceReputationContextParams {
  /**
   * Opt the returned/embedded user(s) into a space-scoped `spaceReputation`.
   */
  spaceReputation?: SpaceReputationContextObject;
}

/**
 * Space-reputation params for user-direct endpoints (e.g. `/users/:id`,
 * `/users/by-username`, `/users/:id/followers`). Same fields as
 * {@link SpaceReputationContextParams}, but `"context"` is rejected by the
 * server (400) on these routes — only a `<uuid>` or `"none"` is valid.
 */
export interface SpaceReputationUserParams {
  /**
   * Opt the returned user(s) into a space-scoped `spaceReputation`.
   */
  spaceReputation?: SpaceReputationUserObject;
}
