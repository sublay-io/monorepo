import { SublayHttpClient } from "../../core/client";
import type { WithOneWaySortDir } from "../../interfaces/OneWaySortParams";
import {
  Comment,
  CommentReplySortBy,
  CommentsSortBy,
  CommentThreadIncludeParam,
} from "../../interfaces/Comment";
import { ReactionType } from "../../interfaces/Reaction";
import { CursorPaginatedResponse } from "../../interfaces/IPaginatedResponse";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

interface FetchManyCommentsBaseProps extends SpaceReputationContextParams {
  /** How many comments at the level being fetched (server default 10, max 100). */
  limit?: number;
  /**
   * `pagination.nextCursor` from the previous response, passed as returned;
   * omit it (or pass `null`) for the first page.
   */
  cursor?: string | null;
  /** Sort for the level being fetched (server default "createdAt"). */
  sortBy?: CommentsSortBy;
  /** Applies to every sort (server default "desc"). */
  sortDir?: "asc" | "desc";
  /** With `sortBy: "top"` only: rank by this reaction's raw count (server default "upvote"). */
  sortByReaction?: ReactionType;
  include?: CommentThreadIncludeParam;
  /** Levels of replies to nest under each returned comment (0–5, server default 0). */
  replyDepth?: number;
  /** Replies per comment in the nested levels only (≥ 1, server default 3). */
  replyLimit?: number;
  /** Sort for the nested levels; each defaults to the level's own. */
  replySortBy?: CommentReplySortBy;
  replySortDir?: "asc" | "desc";
  replySortByReaction?: ReactionType;
  /**
   * List as this user (service key only): the page is exactly what their
   * own access token would get (blocks, hidden posts, moderation details).
   * Omit it for the anonymous view.
   */
  actingUserId?: string;
}

/**
 * A thread fetch (`GET /comments`): `entityId` → that entity's top-level
 * comments; `parentId` (alone — the parent decides the entity) → a comment's
 * direct replies. Exactly one of the two, and no `sortDir` with
 * `sortBy: "controversial"`. A user's comment history is
 * `users.fetchCommentsByUserId`.
 */
export type FetchManyCommentsProps =
  | WithOneWaySortDir<
      FetchManyCommentsBaseProps & { entityId: string; parentId?: null }
    >
  | WithOneWaySortDir<
      FetchManyCommentsBaseProps & { parentId: string; entityId?: null }
    >;

export async function fetchManyComments(
  client: SublayHttpClient,
  data: FetchManyCommentsProps
): Promise<CursorPaginatedResponse<Comment>> {
  const {
    entityId,
    parentId,
    limit,
    cursor,
    sortBy,
    sortDir,
    sortByReaction,
    include,
    replyDepth,
    replyLimit,
    replySortBy,
    replySortDir,
    replySortByReaction,
    actingUserId,
    spaceReputation,
    spaceReputationId,
    spaceReputationDescendants,
  } = data;
  // Only the thread endpoint's own params are forwarded (no spread), so a
  // stray `page` / `userId` / `sourceId` / `blockedFilter` never reaches it.
  const params: Record<string, unknown> = {
    entityId,
    parentId,
    limit,
    cursor: cursor ?? undefined,
    sortBy,
    sortDir,
    sortByReaction,
    include: Array.isArray(include) ? include.join(",") : include,
    replyDepth,
    replyLimit,
    replySortBy,
    // The server refuses replySortDir when the nested sort is controversial
    // (it ranks one way only).
    replySortDir:
      (replySortBy ?? sortBy) === "controversial" ? undefined : replySortDir,
    replySortByReaction,
    actingUserId,
    ...buildSpaceReputationParams({
      spaceReputation,
      spaceReputationId,
      spaceReputationDescendants,
    }),
  };
  for (const key of Object.keys(params)) {
    if (params[key] === undefined) delete params[key];
  }
  const response = await client.projectInstance.get<
    CursorPaginatedResponse<Comment>
  >("/comments", { params });
  return response.data;
}
