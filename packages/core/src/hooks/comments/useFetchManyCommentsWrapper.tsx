import { useCallback } from "react";
import {
  CommentReplySortByOptions,
  CommentsSortByOptions,
} from "../../interfaces/CommentsSortByOptions";
import { CommentThreadIncludeParam } from "../../interfaces/models/Comment";
import { ReactionType } from "../../interfaces/models/Reaction";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import useFetchManyComments from "./useFetchManyComments";
import { sendableReplySortByReaction } from "../../helpers/commentThreadConfig";
import {
  CommentListSort,
  CursorCommentListValues,
  useCursorCommentList,
} from "./useCursorCommentList";

/**
 * A stateful thread list (`GET /comments`): an entity's top-level comments
 * (`entityId`) or a comment's direct replies (`parentId`), cursor-paged.
 * Nested replies (`replyDepth` > 0) come back inside each comment's `replies`
 * exactly as delivered. For a user's history use
 * `useFetchCommentsByUserIdWrapper`.
 */
export interface UseFetchManyCommentsWrapperProps
  extends SpaceReputationContextParams {
  entityId?: string | null;
  parentId?: string | null;
  limit?: number;
  include?: CommentThreadIncludeParam;
  defaultSortBy?: CommentsSortByOptions;
  /** Applies to every sort. Defaults to `"desc"`. */
  defaultSortDir?: "asc" | "desc";
  /** With `sortBy: "top"`: rank by this reaction's raw count (server default `"upvote"`). */
  defaultSortByReaction?: ReactionType;
  replyDepth?: number;
  replyLimit?: number;
  replySortBy?: CommentReplySortByOptions;
  replySortDir?: "asc" | "desc";
  replySortByReaction?: ReactionType;
}

export type UseFetchManyCommentsWrapperValues = CursorCommentListValues;

function useFetchManyCommentsWrapper(
  props: UseFetchManyCommentsWrapperProps,
): UseFetchManyCommentsWrapperValues {
  const {
    entityId,
    parentId,
    limit = 10,
    include,
    defaultSortBy = "createdAt",
    defaultSortDir = "desc",
    defaultSortByReaction,
    replyDepth,
    replyLimit,
    replySortBy,
    replySortDir,
    replySortByReaction,
    spaceReputation,
    spaceReputationId,
    spaceReputationDescendants,
  } = props;

  const fetchManyComments = useFetchManyComments();

  const resetKey = JSON.stringify({
    entityId,
    parentId,
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
  });

  const fetchPage = useCallback(
    (cursor: string | null, sort: CommentListSort) =>
      fetchManyComments({
        ...(parentId
          ? { parentId, entityId: entityId ?? undefined }
          : { entityId: entityId as string }),
        cursor,
        limit,
        include,
        sortBy: sort.sortBy,
        sortDir: sort.sortDir,
        sortByReaction: sort.sortBy === "top" ? sort.sortByReaction : undefined,
        replyDepth,
        replyLimit,
        replySortBy,
        replySortDir,
        replySortByReaction: sendableReplySortByReaction(
          replySortBy,
          sort.sortBy,
          replySortByReaction,
        ),
        spaceReputation,
        spaceReputationId,
        spaceReputationDescendants,
      }),
    [fetchManyComments, resetKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return useCursorCommentList({
    enabled: !!(entityId || parentId),
    resetKey,
    defaultSortBy,
    defaultSortDir,
    defaultSortByReaction,
    fetchPage,
  });
}

export default useFetchManyCommentsWrapper;
