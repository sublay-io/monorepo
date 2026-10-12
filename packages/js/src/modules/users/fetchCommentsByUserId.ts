import { SublayHttpClient } from "../../core/client";
import {
  Comment,
  CommentIncludeParam,
  CommentsSortBy,
} from "../../interfaces/Comment";
import { ReactionType } from "../../interfaces/Reaction";
import { CursorPaginatedResponse } from "../../interfaces/IPaginatedResponse";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchCommentsByUserIdProps extends SpaceReputationContextParams {
  userId: string;
  /** Only comments on this entity. */
  entityId?: string;
  /** Only comments on entities from this source. */
  sourceId?: string;
  /**
   * Comments by users block-edged with the viewer are hidden by default
   * ("exclude"). "include-outbound-blocked" re-includes ONLY the viewer's own
   * outbound-blocked authors; never inbound.
   */
  blockedFilter?: "exclude" | "include-outbound-blocked";
  /** Server default "createdAt". */
  sortBy?: CommentsSortBy;
  /** Applies to every sort (server default "desc"). */
  sortDir?: "asc" | "desc";
  /** With `sortBy: "top"` only (server default "upvote"). */
  sortByReaction?: ReactionType;
  /** Server default 10, max 100. */
  limit?: number;
  /**
   * `pagination.nextCursor` from the previous response, passed as returned;
   * omit it (or pass `null`) for the first page.
   */
  cursor?: string | null;
  include?: CommentIncludeParam;
}

/** A user's comment history (`GET /users/:userId/comments`): flat, any depth, cursor-paged. */
export async function fetchCommentsByUserId(
  client: SublayHttpClient,
  data: FetchCommentsByUserIdProps
): Promise<CursorPaginatedResponse<Comment>> {
  const {
    userId,
    include,
    cursor,
    spaceReputation,
    spaceReputationId,
    spaceReputationDescendants,
    ...rest
  } = data;
  const params = {
    ...rest,
    // A `null` cursor (the last page's `nextCursor`) is not sent.
    ...(cursor != null ? { cursor } : {}),
    ...(include !== undefined
      ? { include: Array.isArray(include) ? include.join(",") : include }
      : {}),
    ...buildSpaceReputationParams({
      spaceReputation,
      spaceReputationId,
      spaceReputationDescendants,
    }),
  };
  const response = await client.projectInstance.get<
    CursorPaginatedResponse<Comment>
  >(`/users/${userId}/comments`, { params });
  return response.data;
}
