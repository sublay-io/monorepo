import { useState } from "react";
import { Comment } from "../../interfaces/models/Comment";
import { CommentsSortByOptions } from "../../interfaces/CommentsSortByOptions";
import { ReactionType } from "../../interfaces/models/Reaction";
import { CursorPaginatedResponse } from "../../interfaces/PaginatedResponse";
import { useListEngine } from "../list/useListEngine";
import { cursorPaging } from "../list/paging";

export interface CommentListSort {
  sortBy: CommentsSortByOptions;
  sortDir: "asc" | "desc";
  sortByReaction: ReactionType | undefined;
}

export interface CursorCommentListValues {
  comments: Comment[];
  loading: boolean;
  /**
   * The last failure loading the list. Cleared when the next load starts.
   * `loadMore()` retries a failed load, including a failed first page.
   */
  error: Error | null;
  hasMore: boolean;
  sortBy: CommentsSortByOptions;
  setSortBy: (newSortBy: CommentsSortByOptions) => void;
  sortDir: "asc" | "desc";
  setSortDir: (newSortDir: "asc" | "desc") => void;
  /** Only sent with `sortBy: "top"`. */
  sortByReaction: ReactionType | undefined;
  setSortByReaction: (newReaction: ReactionType | undefined) => void;
  /**
   * Fetch the next page, or retry the one that failed. Does nothing while a
   * page is loading or when there's nothing more; never throws (failures land
   * in `error`).
   */
  loadMore: () => Promise<void>;
  /**
   * Reload from the first page with the current sort. What is loaded stays
   * until the new first page replaces it. Never throws (failures land in
   * `error`).
   */
  refetch: () => Promise<void>;
}

/**
 * The shared engine behind the flat, cursor-paged comment-list wrappers
 * (`useFetchManyCommentsWrapper`, `useFetchCommentsByUserIdWrapper`): the
 * list engine plus the sort state. Resets whenever `resetKey` or the sort
 * changes; responses from before a reset are dropped.
 */
export function useCursorCommentList({
  enabled,
  resetKey,
  defaultSortBy,
  defaultSortDir,
  defaultSortByReaction,
  fetchPage,
}: {
  enabled: boolean;
  resetKey: string;
  defaultSortBy: CommentsSortByOptions;
  defaultSortDir: "asc" | "desc";
  defaultSortByReaction?: ReactionType;
  fetchPage: (
    cursor: string | null,
    sort: CommentListSort,
  ) => Promise<CursorPaginatedResponse<Comment>>;
}): CursorCommentListValues {
  const [sortBy, setSortBy] = useState<CommentsSortByOptions>(defaultSortBy);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
  const [sortByReaction, setSortByReaction] = useState<ReactionType | undefined>(
    defaultSortByReaction,
  );

  // The reaction only matters to `top`; changing it under another sort
  // doesn't reset the list.
  const effectiveSortByReaction = sortBy === "top" ? sortByReaction : undefined;
  const sort: CommentListSort = { sortBy, sortDir, sortByReaction };

  const list = useListEngine<Comment, string>({
    enabled,
    resetKey: JSON.stringify([resetKey, sortBy, sortDir, effectiveSortByReaction]),
    // As before the cursor rewrite: `loading` starts true and stays true
    // until there's something to fetch.
    pendingUntilEnabled: true,
    getKey: (comment) => comment.id,
    fetchPage: cursorPaging((cursor) => fetchPage(cursor, sort)),
    errorLabel: "Failed to fetch comments:",
  });

  return {
    comments: list.items,
    loading: list.loading,
    error: list.error,
    hasMore: list.hasMore,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    sortByReaction,
    setSortByReaction,
    loadMore: list.loadMore,
    refetch: list.refetch,
  };
}
