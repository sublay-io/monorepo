import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useCommentSection } from "@sublay/react-js";
import LoadedComments from "./loaded-comments";
import FetchingCommentsSkeletons from "./fetching-comments-skeletons";
import NoCommentsPlaceHolder from "./no-comments-placeholder";
import useUIState from "../../hooks/use-ui-state";

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
    const { theme } = useUIState();

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
        <div style={{ flex: 1 }}>
          <FetchingCommentsSkeletons />
        </div>
      );
    }

    if (focused) {
      return (
        <div style={{ flex: 1 }}>
          <div style={{ padding: "0 0 8px 0" }}>
            <button
              onClick={() => setShowAll(true)}
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: theme === "dark" ? "#3B82F6" : "#2563EB",
                padding: "4px 8px",
                borderRadius: "9999px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
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
    const mutedColor = theme === "dark" ? "#9CA3AF" : "#6B7280";
    const linkColor = theme === "dark" ? "#3B82F6" : "#2563EB";
    const tryAgainStyle: React.CSSProperties = {
      fontSize: "12px",
      fontWeight: 500,
      color: linkColor,
      padding: 0,
      background: "transparent",
      border: "none",
      cursor: "pointer",
    };

    return (
      <div style={{ flex: 1 }}>
        {showLoadedComments && <LoadedComments data={mergedComments} />}
        {showLoadedComments && hasMore && (
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            {showLoadMoreError ? (
              <div style={{ fontSize: "12px", color: mutedColor, padding: "4px 12px" }}>
                Couldn't load more ·{" "}
                <button onClick={() => loadMore?.()} style={tryAgainStyle}>
                  Try again
                </button>
              </div>
            ) : (
              <button
                onClick={() => loadMore?.()}
                disabled={loading}
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: theme === 'dark' ? "#3B82F6" : "#2563EB",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {loading ? "Loading..." : "Load more comments"}
              </button>
            )}
          </div>
        )}
        {showFetchingSkeletons && <FetchingCommentsSkeletons />}
        {showLoadError && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <p style={{ fontSize: "14px", color: mutedColor, margin: "0 0 4px 0" }}>
              Couldn't load comments
            </p>
            <button onClick={() => loadMore?.()} style={tryAgainStyle}>
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
