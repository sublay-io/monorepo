import { useCallback } from "react";
import { oneWaySortFields } from "../../helpers/oneWaySorts";
import { CommentsSortByOptions } from "../../interfaces/CommentsSortByOptions";
import { CommentIncludeParam } from "../../interfaces/models/Comment";
import { ReactionType } from "../../interfaces/models/Reaction";
import { BlockedFilter } from "../../interfaces/BlockedFilter";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import useFetchCommentsByUserId from "./useFetchCommentsByUserId";
import {
  CommentListSort,
  CursorCommentListValues,
  useCursorCommentList,
} from "./useCursorCommentList";

/** A stateful list of a user's comments (`GET /users/:userId/comments`), cursor-paged. */
export interface UseFetchCommentsByUserIdWrapperProps
  extends SpaceReputationContextParams {
  userId: string | null | undefined;
  entityId?: string | null;
  sourceId?: string | null;
  blockedFilter?: BlockedFilter | null;
  limit?: number;
  include?: CommentIncludeParam;
  defaultSortBy?: CommentsSortByOptions;
  /** Applies to every sort. Defaults to `"desc"`. */
  defaultSortDir?: "asc" | "desc";
  /** With `sortBy: "top"`: rank by this reaction's raw count (server default `"upvote"`). */
  defaultSortByReaction?: ReactionType;
}

export type UseFetchCommentsByUserIdWrapperValues = CursorCommentListValues;

function useFetchCommentsByUserIdWrapper(
  props: UseFetchCommentsByUserIdWrapperProps,
): UseFetchCommentsByUserIdWrapperValues {
  const {
    userId,
    entityId,
    sourceId,
    blockedFilter,
    limit = 10,
    include,
    defaultSortBy = "createdAt",
    defaultSortDir = "desc",
    defaultSortByReaction,
    spaceReputation,
    spaceReputationId,
    spaceReputationDescendants,
  } = props;

  const fetchCommentsByUserId = useFetchCommentsByUserId();

  const resetKey = JSON.stringify({
    userId,
    entityId,
    sourceId,
    blockedFilter,
    limit,
    include,
    spaceReputation,
    spaceReputationId,
    spaceReputationDescendants,
  });

  const fetchPage = useCallback(
    (cursor: string | null, sort: CommentListSort) =>
      fetchCommentsByUserId({
        userId: userId as string,
        entityId,
        sourceId,
        blockedFilter,
        cursor,
        limit,
        include,
        ...oneWaySortFields(sort.sortBy, sort.sortDir),
        sortByReaction: sort.sortBy === "top" ? sort.sortByReaction : undefined,
        spaceReputation,
        spaceReputationId,
        spaceReputationDescendants,
      }),
    [fetchCommentsByUserId, resetKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return useCursorCommentList({
    enabled: !!userId,
    resetKey,
    defaultSortBy,
    defaultSortDir,
    defaultSortByReaction,
    fetchPage,
  });
}

export default useFetchCommentsByUserIdWrapper;
