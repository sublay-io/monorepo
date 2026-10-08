import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { Comment } from "../../interfaces/models/Comment";
import { handleError } from "../../utils/handleError";
import useFetchManyComments from "./useFetchManyComments";
import { isUUID } from "../../utils/isUUID";
import { CommentSectionInternalContext } from "./useEntityComments";
import {
  applyRepliesPage,
  nodeRepliesHasMore,
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
  /** The last failure loading replies (cleared by the next successful load). */
  error: Error | null;
  /** Whether "load more replies" has anything to fetch. */
  hasMore: boolean;
  /**
   * Load the next replies, continuing after the ones already loaded. Does
   * nothing while loading or when there's nothing more; never throws.
   */
  loadMore: (options?: LoadMoreRepliesOptions) => Promise<void>;
}

const toError = (err: unknown): Error =>
  err instanceof Error ? err : new Error(String(err));

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadingRef = useRef(false);

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

  const loadMore = useCallback(
    async (options: LoadMoreRepliesOptions = {}) => {
      const { internals: ctx, hasMore: more, replyDepthProp: depthProp, limit: defaultLimit } =
        latest.current;
      if (!ctx || loadingRef.current || !more) return;
      if (!commentId || !isUUID(commentId)) return;
      const current = ctx.store.nodes[commentId];
      if (!current) return;

      const pageLimit = options.limit ?? defaultLimit;
      const firstLoad = !current.repliesLoaded;

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
      loadingRef.current = true;
      setLoading(true);
      try {
        // Replies are the level being fetched, so the section's reply sort is
        // sent as the level sort; nested levels inherit it on the server.
        const response = await fetchManyComments({
          parentId: commentId,
          cursor: current.repliesCursor,
          limit: pageLimit,
          sortBy: ctx.replySort.sortBy,
          sortDir: ctx.replySort.sortDir,
          sortByReaction: ctx.replySort.sortByReaction,
          include: ctx.include,
          ...(replyDepth > 0 ? { replyDepth, replyLimit: ctx.replyLimit } : {}),
          ...ctx.reputation,
        });
        if (generation !== ctx.generationRef.current) return;
        ctx.setStore((prev) => applyRepliesPage(prev, commentId, response));
        setError(null);
      } catch (err) {
        if (generation !== ctx.generationRef.current) return;
        setError(toError(err));
        handleError(err, "Failed to fetch replies:");
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [commentId, fetchManyComments],
  );

  return {
    comment: node?.comment,
    replies,
    newReplies,
    loading,
    error,
    hasMore,
    loadMore,
  };
}

export default useReplies;
