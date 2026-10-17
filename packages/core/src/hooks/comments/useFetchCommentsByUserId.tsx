import { useCallback } from "react";
import type { WithOneWaySortDir } from "../../interfaces/OneWaySortParams";
import { sendableSortDir } from "../../helpers/oneWaySorts";
import { CommentsSortByOptions } from "../../interfaces/CommentsSortByOptions";
import { Comment, CommentIncludeParam } from "../../interfaces/models/Comment";
import { ReactionType } from "../../interfaces/models/Reaction";
import { CursorPaginatedResponse } from "../../interfaces/PaginatedResponse";
import { BlockedFilter } from "../../interfaces/BlockedFilter";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../utils/spaceReputationParams";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";

/**
 * A user's comment history (`GET /users/:userId/comments`): flat, at any
 * depth, cursor-paged.
 */
export interface FetchCommentsByUserIdBaseProps extends SpaceReputationContextParams {
  userId: string;
  /** Only comments on this entity. */
  entityId?: string | null;
  /** Only comments on entities from this source. */
  sourceId?: string | null;
  /** Server default: `"exclude"`. */
  blockedFilter?: BlockedFilter | null;
  /** Server default: `"createdAt"`. */
  sortBy?: CommentsSortByOptions;
  /** Applies to every sort. Server default: `"desc"`. */
  sortDir?: "asc" | "desc";
  /** With `sortBy: "top"` only (server default `"upvote"`). */
  sortByReaction?: ReactionType;
  /** Server default 10, max 100. */
  limit?: number;
  /** `pagination.nextCursor` from the previous response; omit for the first page. */
  cursor?: string | null;
  include?: CommentIncludeParam;
}

/** `sortDir` is not accepted with `sortBy: "controversial"`. */
export type FetchCommentsByUserIdProps = WithOneWaySortDir<FetchCommentsByUserIdBaseProps>;

function useFetchCommentsByUserId(): (
  props: FetchCommentsByUserIdProps,
) => Promise<CursorPaginatedResponse<Comment>> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  return useCallback(
    async (
      props: FetchCommentsByUserIdProps,
    ): Promise<CursorPaginatedResponse<Comment>> => {
      const {
        userId,
        entityId,
        sourceId,
        blockedFilter,
        sortBy,
        sortDir,
        sortByReaction,
        limit,
        cursor,
        include,
        spaceReputation,
        spaceReputationId,
        spaceReputationDescendants,
      } = props;

      if (!projectId) {
        throw new Error("No project specified");
      }

      if (!userId) {
        throw new Error("No user ID passed");
      }

      if (limit === 0) {
        throw new Error("Can't fetch with limit 0");
      }

      const params: Record<string, any> = {
        ...buildSpaceReputationParams({
          spaceReputation,
          spaceReputationId,
          spaceReputationDescendants,
        }),
      };

      if (entityId) params.entityId = entityId;
      if (sourceId) params.sourceId = sourceId;
      if (blockedFilter) params.blockedFilter = blockedFilter;
      if (sortBy) params.sortBy = sortBy;
      // The server refuses sortDir with controversial.
      const sendSortDir = sendableSortDir(sortBy, sortDir);
      if (sendSortDir) params.sortDir = sendSortDir;
      if (sortByReaction) params.sortByReaction = sortByReaction;
      if (limit !== undefined) params.limit = limit;
      if (cursor) params.cursor = cursor;
      if (include && include.length > 0) {
        params.include = Array.isArray(include) ? include.join(",") : include;
      }

      const response = await axios.get<CursorPaginatedResponse<Comment>>(
        `/${projectId}/users/${userId}/comments`,
        { params },
      );
      return response.data;
    },
    [projectId, axios],
  );
}

export default useFetchCommentsByUserId;
