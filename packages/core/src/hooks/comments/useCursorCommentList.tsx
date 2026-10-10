import { useCallback, useEffect, useRef, useState } from "react";
import { Comment } from "../../interfaces/models/Comment";
import { CommentsSortByOptions } from "../../interfaces/CommentsSortByOptions";
import { ReactionType } from "../../interfaces/models/Reaction";
import { CursorPaginatedResponse } from "../../interfaces/PaginatedResponse";
import { handleError } from "../../utils/handleError";

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
}

const toError = (err: unknown): Error =>
  err instanceof Error ? err : new Error(String(err));

/**
 * The shared engine behind the flat, cursor-paged comment-list wrappers
 * (`useFetchManyCommentsWrapper`, `useFetchCommentsByUserIdWrapper`). Resets
 * whenever `resetKey` or the sort changes; responses from before a reset are
 * dropped.
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

  const [comments, setComments] = useState<Comment[]>([]);
  // As before the cursor rewrite: `loading` starts true and stays true until
  // there's something to fetch.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const cursorRef = useRef<string | null>(null);
  const generationRef = useRef(0);

  // Always the latest props, so loadMore keeps a stable identity.
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;
  const sortRef = useRef<CommentListSort>({ sortBy, sortDir, sortByReaction });
  sortRef.current = { sortBy, sortDir, sortByReaction };

  const runFetch = useCallback(async (reset: boolean) => {
    const generation = reset ? ++generationRef.current : generationRef.current;
    loadingRef.current = true;
    setLoading(true);
    // Every load (a reset, the next page, a retry) starts without the last
    // failure.
    setError(null);
    if (reset) {
      cursorRef.current = null;
      hasMoreRef.current = true;
      setHasMore(true);
      setComments([]);
    }
    try {
      const response = await fetchPageRef.current(
        reset ? null : cursorRef.current,
        sortRef.current,
      );
      if (generation !== generationRef.current) return;
      const { data, pagination } = response;
      setComments((prev) => {
        if (reset) return data;
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...data.filter((c) => !seen.has(c.id))];
      });
      cursorRef.current = pagination.nextCursor;
      hasMoreRef.current = pagination.hasMore;
      setHasMore(pagination.hasMore);
      setError(null);
    } catch (err) {
      if (generation !== generationRef.current) return;
      setError(toError(err));
      handleError(err, "Failed to fetch comments:");
    } finally {
      if (generation === generationRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  // The reaction only matters to `top`; changing it under another sort
  // doesn't reset the list.
  const effectiveSortByReaction = sortBy === "top" ? sortByReaction : undefined;
  useEffect(() => {
    if (!enabled) {
      // Drop any in-flight response for the previous target.
      generationRef.current++;
      return;
    }
    runFetch(true);
  }, [enabled, resetKey, sortBy, sortDir, effectiveSortByReaction, runFetch]);

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const loadMore = useCallback(async () => {
    if (!enabledRef.current || loadingRef.current || !hasMoreRef.current) return;
    await runFetch(false);
  }, [runFetch]);

  return {
    comments,
    loading,
    error,
    hasMore,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    sortByReaction,
    setSortByReaction,
    loadMore,
  };
}
