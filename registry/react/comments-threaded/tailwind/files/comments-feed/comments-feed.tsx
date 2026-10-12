import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
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
      highlightedCommentLoading,
    } = useCommentSection();

    // Whether the viewer left the focused thread for the full view. Reset
    // whenever the highlighted comment changes (including X → none → X), so a
    // fresh deep link always opens focused.
    const [showAll, setShowAll] = useState(false);
    const highlightedId = highlightedComment?.comment.id ?? null;
    const [prevHighlightedId, setPrevHighlightedId] = useState(highlightedId);
    if (highlightedId !== prevHighlightedId) {
      setPrevHighlightedId(highlightedId);
      setShowAll(false);
    }

    // Deep link: only the highlighted comment's thread — its parent (or the
    // comment itself when it's top-level), with the normal replies under it.
    const focused = highlightedComment && !showAll ? highlightedComment : null;

    // A new top-level comment posted from the focused view switches to the
    // full view, so the viewer sees it. Replies stay in the focused thread.
    const newCommentsCount = newComments?.length ?? 0;
    const prevNewCommentsCount = useRef(newCommentsCount);
    useEffect(() => {
      if (focused && newCommentsCount > prevNewCommentsCount.current) {
        setShowAll(true);
      }
      prevNewCommentsCount.current = newCommentsCount;
    }, [newCommentsCount, focused]);

    const mergedComments = useMemo(
      () => [...(newComments ?? []), ...(comments ?? [])],
      [comments, newComments]
    );

    // While the highlighted comment loads, show the loading state rather than
    // the full list, so the section doesn't switch from the list to the
    // focused thread once it arrives.
    if (highlightedCommentLoading) {
      return (
        <div className="flex-1">
          <FetchingCommentsSkeletons />
        </div>
      );
    }

    if (focused) {
      return (
        <div className="flex-1">
          <div className="pb-2">
            <button
              onClick={() => setShowAll(true)}
              className="text-xs font-medium text-blue-600 dark:text-blue-500 px-2 py-1 rounded-full bg-transparent border-none cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              View all comments
            </button>
          </div>
          <LoadedComments data={[focused.parentComment ?? focused.comment]} />
        </div>
      );
    }

    const showLoadedComments = mergedComments.length > 0;
    const showFetchingSkeletons = loading && mergedComments.length === 0;
    // A failed load shows a retry; `loadMore()` re-sends the request that failed.
    const showLoadError = !loading && !!error && mergedComments.length === 0;
    const showNoComments = !loading && !error && mergedComments.length === 0;
    const showLoadMoreError = !loading && !!error;
    const tryAgainClassName =
      "text-xs font-medium text-blue-600 dark:text-blue-500 p-0 bg-transparent border-none cursor-pointer hover:underline";

    return (
      <div className="flex-1">
        {showLoadedComments && <LoadedComments data={mergedComments} />}
        {showLoadedComments && hasMore && (
          <div className="flex justify-center py-2">
            {showLoadMoreError ? (
              <div className="text-xs text-gray-500 dark:text-neutral-400 px-3 py-1">
                Couldn't load more ·{" "}
                <button onClick={() => loadMore?.()} className={tryAgainClassName}>
                  Try again
                </button>
              </div>
            ) : (
              <button
                onClick={() => loadMore?.()}
                disabled={loading}
                className="text-xs font-medium text-blue-600 dark:text-blue-500 px-3 py-1 rounded-full bg-transparent border-none cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950"
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
