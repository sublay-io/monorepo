import { oneWaySortFields } from "../../helpers/oneWaySorts";
import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { Comment } from "../../interfaces/models/Comment";
import { handleError } from "../../utils/handleError";
import { toError } from "../../utils/toError";
import useFetchManyComments from "./useFetchManyComments";
import { isUUID } from "../../utils/isUUID";
import { CommentSectionInternalContext } from "./useEntityComments";
import {
  applyRepliesPage,
  emptyCommentStore,
  nodeRepliesHasMore,
  replaceRepliesPage,
  selectReplies,
} from "../../helpers/commentStore";
import {
  COMMENT_REPLY_BUDGET,
  fitReplyDepthToBudget,
  isDevBuild,
} from "../../helpers/commentThreadConfig";

export interface UseRepliesProps {
  commentId: string;
  /** Direct replies per load. Defaults to 10. */
  limit?: number;
  /**
   * Levels of replies to nest on this comment's **first** load. Defaults to
   * the section's `replyDepth`. Later loads don't nest.
   */
  replyDepth?: number;
}

export interface LoadMoreRepliesOptions {
  /** Override the nesting for this load. */
  replyDepth?: number;
  /** Override how many direct replies this load fetches. */
  limit?: number;
}

export interface UseRepliesValues {
  /** The comment itself (from the section's store), if loaded. */
  comment: Comment | undefined;
  /** Its loaded replies, in order. */
  replies: Comment[];
  /** Replies the viewer posted this session, newest first (kept out of `replies`). */
  newReplies: Comment[];
  loading: boolean;
  /**
   * The last failure loading replies. Cleared when the next load starts or the
   * section resets (e.g. a sort change); `loadMore()` retries it.
   */
  error: Error | null;
  /** Whether "load more replies" has anything to fetch. */
  hasMore: boolean;
  /**
   * Load the next replies, continuing after the ones already loaded, or retry
   * the load that failed. Does nothing while loading or when there's nothing
   * more; never throws (failures land in `error`).
   */
  loadMore: (options?: LoadMoreRepliesOptions) => Promise<void>;
  /**
   * Reload this comment's replies from the first page, nested as a first load
   * is. The replies loaded so far stay until the new page replaces them; the
   * viewer's own new replies are kept. Never throws (failures land in
   * `error`; `loadMore()` retries the refetch).
   */
  refetch: (options?: LoadMoreRepliesOptions) => Promise<void>;
}


/**
 * A comment's replies inside a `CommentSectionProvider`. Never fetches on its
 * own: call `loadMore()`. The first load of a comment's replies nests
 * (`replyDepth`, inherited from the section) and later loads don't; it always
 * continues from what's already loaded — including replies the section
 * brought in nested.
 */
function useReplies({
  commentId,
  limit = 10,
  replyDepth: replyDepthProp,
}: UseRepliesProps): UseRepliesValues {
  const internals = useContext(CommentSectionInternalContext);
  const fetchManyComments = useFetchManyComments();

  // Loading and failure belong to a comment, not to this hook instance: an
  // instance moved to another comment (a recycled row) starts clean there,
  // and a load still in flight for the comment it left neither shows as this
  // one's loading nor blocks its `loadMore`.
  const [loadingIds, setLoadingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  // Each failure is tagged with the section generation it happened in: a
  // section reset (sort change) makes an older failure stale, so it no longer
  // shows.
  const [failures, setFailures] = useState<
    Record<string, { error: Error; generation: number; refetch: boolean }>
  >({});
  const failuresRef = useRef(failures);
  failuresRef.current = failures;
  const loading = loadingIds.has(commentId);
  const failure = failures[commentId];
  const error =
    failure && failure.generation === internals?.generationRef.current
      ? failure.error
      : null;
  const inFlightRef = useRef<Set<string>>(new Set());

  const store = internals?.store;
  const node = store?.nodes[commentId];

  const { replies, newReplies } = useMemo(() => {
    if (!store) return { replies: [], newReplies: [] };
    return selectReplies(store, commentId);
  }, [store, commentId]);

  const hasMore = store ? nodeRepliesHasMore(store, commentId) : false;

  // Latest values for the stable loadMore callback.
  const latest = useRef({ internals, hasMore, replyDepthProp, limit });
  latest.current = { internals, hasMore, replyDepthProp, limit };

  const load = useCallback(
    async (options: LoadMoreRepliesOptions, refetch: boolean) => {
      const { internals: ctx, replyDepthProp: depthProp, limit: defaultLimit } =
        latest.current;
      if (!ctx || inFlightRef.current.has(commentId)) return;
      if (!commentId || !isUUID(commentId)) return;
      const current = ctx.store.nodes[commentId];
      if (!current) return;

      const pageLimit = options.limit ?? defaultLimit;
      const firstLoad = refetch || !current.repliesLoaded;

      // Default rule: nest on the first load, plain pages after (D8). An
      // explicit depth (hook prop or this call) is sent as-is; the section's
      // inherited default is lowered to fit the row budget (D12).
      let replyDepth: number;
      if (options.replyDepth !== undefined) {
        replyDepth = options.replyDepth;
      } else if (!firstLoad) {
        replyDepth = 0;
      } else if (depthProp !== undefined) {
        replyDepth = depthProp;
      } else {
        replyDepth = fitReplyDepthToBudget(pageLimit, ctx.replyDepth, ctx.replyLimit);
        if (replyDepth < ctx.replyDepth && isDevBuild()) {
          console.warn(
            `[Sublay] useReplies: lowered replyDepth from ${ctx.replyDepth} to ${replyDepth} so a ${pageLimit}-reply load stays within the ${COMMENT_REPLY_BUDGET}-comment request limit. Pass replyDepth explicitly to override.`,
          );
        }
      }

      const generation = ctx.generationRef.current;
      const clearFailure = () =>
        setFailures((prev) => {
          if (!(commentId in prev)) return prev;
          const { [commentId]: _cleared, ...rest } = prev;
          return rest;
        });
      inFlightRef.current.add(commentId);
      setLoadingIds((prev) => new Set(prev).add(commentId));
      clearFailure();
      try {
        // Replies are the level being fetched, so the section's reply sort is
        // sent as the level sort; nested levels inherit it on the server.
        const response = await fetchManyComments({
          parentCommentId: commentId,
          cursor: refetch ? null : current.repliesCursor,
          limit: pageLimit,
          ...oneWaySortFields(ctx.replySort.sortBy, ctx.replySort.sortDir),
          sortByReaction: ctx.replySort.sortByReaction,
          include: ctx.include,
          ...(replyDepth > 0 ? { replyDepth, replyLimit: ctx.replyLimit } : {}),
          ...ctx.reputation,
        });
        if (generation !== ctx.generationRef.current) return;
        // Stored under the comment it was fetched for, whichever comment
        // this instance shows by now.
        ctx.setStore((prev) => {
          if (!refetch) return applyRepliesPage(prev, commentId, response);
          // The highlighted comment (and its parent) stay: they're what the
          // section's highlight seed holds.
          const seed = ctx.seedRef.current;
          const pinned = new Set(
            seed ? Object.keys(seed(emptyCommentStore(), prev).nodes) : [],
          );
          return replaceRepliesPage(prev, commentId, response, pinned);
        });
        clearFailure();
      } catch (err) {
        if (generation !== ctx.generationRef.current) return;
        setFailures((prev) => ({
          ...prev,
          [commentId]: { error: toError(err), generation, refetch },
        }));
        handleError(err, "Failed to fetch replies:");
      } finally {
        inFlightRef.current.delete(commentId);
        setLoadingIds((prev) => {
          if (!prev.has(commentId)) return prev;
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
      }
    },
    [commentId, fetchManyComments],
  );

  const loadMore = useCallback(
    async (options: LoadMoreRepliesOptions = {}) => {
      const ctx = latest.current.internals;
      const failed = failuresRef.current[commentId];
      // A failed refetch is retried as a refetch.
      if (failed?.refetch && failed.generation === ctx?.generationRef.current) {
        await load(options, true);
        return;
      }
      if (!latest.current.hasMore) return;
      await load(options, false);
    },
    [commentId, load],
  );

  const refetch = useCallback(
    (options: LoadMoreRepliesOptions = {}) => load(options, true),
    [load],
  );

  return {
    comment: node?.comment,
    replies,
    newReplies,
    loading,
    error,
    // A failed load is still to do: `loadMore()` retries it.
    hasMore: hasMore || error !== null,
    loadMore,
    refetch,
  };
}

export default useReplies;
