import { useCallback } from "react";
import type { WithOneWaySortDir } from "../../interfaces/OneWaySortParams";
import { sendableSortDir } from "../../helpers/oneWaySorts";
import {
  CommentReplySortByOptions,
  CommentsSortByOptions,
} from "../../interfaces/CommentsSortByOptions";
import {
  Comment,
  CommentThreadIncludeParam,
} from "../../interfaces/models/Comment";
import { ReactionType } from "../../interfaces/models/Reaction";
import { CursorPaginatedResponse } from "../../interfaces/PaginatedResponse";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../utils/spaceReputationParams";

interface FetchManyCommentsBaseProps extends SpaceReputationContextParams {
  /** Sort for the level being fetched. Server default: `"createdAt"`. */
  sortBy?: CommentsSortByOptions;
  /** Applies to every sort. Server default: `"desc"`. */
  sortDir?: "asc" | "desc";
  /** With `sortBy: "top"` only: rank by the raw count of this reaction (server default `"upvote"`). */
  sortByReaction?: ReactionType;
  /** How many comments at the level being fetched (server default 10, max 100). */
  limit?: number;
  /** `pagination.nextCursor` from the previous response; omit for the first page. */
  cursor?: string | null;
  include?: CommentThreadIncludeParam;
  /** Levels of replies to nest under each returned comment (0–5, server default 0). */
  replyDepth?: number;
  /** Replies per comment in the nested levels only (≥ 1, server default 3). */
  replyLimit?: number;
  /** Sort for the nested levels. Each defaults to the level's own. */
  replySortBy?: CommentReplySortByOptions;
  replySortDir?: "asc" | "desc";
  replySortByReaction?: ReactionType;
}

/**
 * A thread fetch (`GET /comments`): `entityId` → that entity's top-level
 * comments; `parentId` → a comment's direct replies. One of the two is
 * required. A user's comment history is `useFetchCommentsByUserId`.
 */
/** `sortDir` is not accepted with `sortBy: "controversial"`. */
export type FetchManyCommentsProps = WithOneWaySortDir<FetchManyCommentsBaseProps> &
  (
    | { entityId: string; parentId?: string | null }
    | { entityId?: string | null; parentId: string }
  );

function useFetchManyComments(): (
  props: FetchManyCommentsProps,
) => Promise<CursorPaginatedResponse<Comment>> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchComments = useCallback(
    async (
      props: FetchManyCommentsProps,
    ): Promise<CursorPaginatedResponse<Comment>> => {
      const {
        entityId,
        parentId,
        sortBy,
        sortDir,
        sortByReaction,
        cursor,
        limit,
        include,
        replyDepth,
        replyLimit,
        replySortBy,
        replySortDir,
        replySortByReaction,
        spaceReputation,
        spaceReputationId,
        spaceReputationDescendants,
      } = props;

      if (!entityId && !parentId) {
        throw new Error("Fetching comments requires an entityId or a parentId");
      }

      if (limit === 0) {
        throw new Error("Can't fetch with limit 0");
      }

      if (!projectId) {
        throw new Error("No project specified");
      }

      const params: Record<string, any> = {
        ...buildSpaceReputationParams({
          spaceReputation,
          spaceReputationId,
          spaceReputationDescendants,
        }),
      };

      if (entityId) params.entityId = entityId;
      if (parentId) params.parentId = parentId;
      if (sortBy) params.sortBy = sortBy;
      // The server refuses sortDir / replySortDir with controversial.
      const sendSortDir = sendableSortDir(sortBy, sortDir);
      if (sendSortDir) params.sortDir = sendSortDir;
      if (sortByReaction) params.sortByReaction = sortByReaction;
      if (limit !== undefined) params.limit = limit;
      if (cursor) params.cursor = cursor;
      if (replyDepth !== undefined) params.replyDepth = replyDepth;
      if (replyLimit !== undefined) params.replyLimit = replyLimit;
      if (replySortBy) params.replySortBy = replySortBy;
      const sendReplySortDir = sendableSortDir(replySortBy ?? sortBy, replySortDir);
      if (sendReplySortDir) params.replySortDir = sendReplySortDir;
      if (replySortByReaction) params.replySortByReaction = replySortByReaction;

      if (include && include.length > 0) {
        params.include = Array.isArray(include) ? include.join(",") : include;
      }

      const response = await axios.get<CursorPaginatedResponse<Comment>>(
        `/${projectId}/comments`,
        {
          params,
        },
      );
      return response.data;
    },
    [projectId, axios],
  );

  return fetchComments;
}

export default useFetchManyComments;
