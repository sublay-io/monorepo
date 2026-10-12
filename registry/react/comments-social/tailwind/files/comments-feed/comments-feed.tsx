import React, { ReactNode, useMemo } from "react";
import { useCommentSection } from "@sublay/react-js";
import LoadedComments from "./loaded-comments";
import FetchingCommentsSkeletons from "./fetching-comments-skeletons";
import NoCommentsPlaceHolder from "./no-comments-placeholder";

const CommentsFeed = React.memo(
  ({ children: customNoCommentsView }: { children?: ReactNode }) => {
    const {
      comments,
      newComments,
      loading,
      error,
      hasMore,
      loadMore,
      highlightedComment,
    } = useCommentSection();

    const mergedComments = useMemo(() => {
      let combinedComments = [...(newComments ?? []), ...(comments ?? [])];

      if (highlightedComment) {
        const { comment, parentComment } = highlightedComment;
        combinedComments = combinedComments.filter(
          (item) => item.id !== comment.id && item.id !== parentComment?.id
        );
      }

      return combinedComments;
    }, [comments, newComments, highlightedComment]);

    const showLoadedComments = mergedComments.length > 0 || highlightedComment;

    const showFetchingSkeletons =
      loading && mergedComments.length === 0 && !highlightedComment;

    // If fetching is done and no comments;
    // Also, because we filter the highlighted comment when it is showing, then we need to make sure this isn't the case here, and show no comments when actually there is one comment - the highlighted one
    const showNoComments =
      !loading && !error && mergedComments.length === 0 && !highlightedComment;

    // A failed load shows a retry; `loadMore()` re-sends the request that failed.
    const showLoadError =
      !loading && !!error && mergedComments.length === 0 && !highlightedComment;
    const showLoadMoreError = !loading && !!error;
    const tryAgainClassName =
      "text-xs font-semibold text-gray-500 dark:text-neutral-400 p-0 bg-transparent border-none cursor-pointer";

    return (
      <div style={{ flex: 1 }}>
        {showLoadedComments && <LoadedComments data={mergedComments} />}
        {showLoadedComments && hasMore && (
          <div className="flex justify-center py-2">
            {showLoadMoreError ? (
              <span className="text-xs text-gray-500 dark:text-neutral-400">
                Couldn't load more ·{" "}
                <button onClick={() => loadMore?.()} className={tryAgainClassName}>
                  Try again
                </button>
              </span>
            ) : (
              <button
                onClick={() => loadMore?.()}
                disabled={loading}
                className="text-xs font-semibold text-gray-500 dark:text-neutral-400 bg-transparent border-none cursor-pointer"
              >
                {loading ? "Loading..." : "Load more comments"}
              </button>
            )}
          </div>
        )}
        {showFetchingSkeletons && <FetchingCommentsSkeletons />}
        {showLoadError && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-1">
              Couldn't load comments
            </p>
            <button onClick={() => loadMore?.()} className={tryAgainClassName}>
              Try again
            </button>
          </div>
        )}
        {showNoComments && (customNoCommentsView ?? <NoCommentsPlaceHolder />)}
      </div>
    );
  }
);

export default CommentsFeed;
