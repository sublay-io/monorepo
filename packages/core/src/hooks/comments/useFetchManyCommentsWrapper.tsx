import { useSublaySelector } from "../../store/hooks";
import { selectUser as selectAuthUser } from "../../store/slices/authSlice";
import useProject from "../projects/useProject";
import { useCallback } from "react";
import { oneWaySortFields } from "../../helpers/oneWaySorts";
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
 * (`entityId`) or a comment's direct replies (`parentCommentId`), cursor-paged.
 * Nested replies (`replyDepth` > 0) come back inside each comment's `replies`
 * exactly as delivered. For a user's history use
 * `useFetchCommentsByUserIdWrapper`.
 */
export interface UseFetchManyCommentsWrapperProps
  extends SpaceReputationContextParams {
  entityId?: string | null;
  parentCommentId?: string | null;
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
    parentCommentId,
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
  } = props;

  const fetchManyComments = useFetchManyComments();

  // A different project is a different list, and so is a different viewer
  // (results carry the viewer's reactions, follows, blocks).
  const { projectId } = useProject();
  const viewerId = useSublaySelector(selectAuthUser)?.id ?? null;
  const resetKey = JSON.stringify({
    projectId,
    viewerId,
    entityId,
    parentCommentId,
    limit,
    include,
    replyDepth,
    replyLimit,
    replySortBy,
    replySortDir,
    replySortByReaction,
    spaceReputation,
  });

  const fetchPage = useCallback(
    (cursor: string | null, sort: CommentListSort) =>
      fetchManyComments({
        // Replies take parentCommentId alone: the parent decides the entity.
        ...(parentCommentId ? { parentCommentId } : { entityId: entityId as string }),
        cursor,
        limit,
        include,
        ...oneWaySortFields(sort.sortBy, sort.sortDir),
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
      }),
    [fetchManyComments, resetKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return useCursorCommentList({
    enabled: !!(entityId || parentCommentId),
    resetKey,
    defaultSortBy,
    defaultSortDir,
    defaultSortByReaction,
    fetchPage,
  });
}

export default useFetchManyCommentsWrapper;
