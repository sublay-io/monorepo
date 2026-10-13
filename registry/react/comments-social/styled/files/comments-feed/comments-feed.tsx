import React, { ReactNode, useMemo } from "react";
import { useCommentSection } from "@sublay/react-js";
import LoadedComments from "./loaded-comments";
import FetchingCommentsSkeletons from "./fetching-comments-skeletons";
import NoCommentsPlaceHolder from "./no-comments-placeholder";
import useUIState from "../../hooks/use-ui-state";
import strings from "../../utils/strings";

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
    const { theme } = useUIState();

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
    const mutedColor = theme === 'dark' ? '#A3A3A3' : '#737373';
    const tryAgainStyle: React.CSSProperties = {
      fontSize: 12,
      fontWeight: 600,
      color: mutedColor,
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
              <span style={{ fontSize: 12, color: mutedColor }}>
                {strings.loadMoreFailed} ·{" "}
                <button onClick={() => loadMore?.()} style={tryAgainStyle}>
                  {strings.tryAgain}
                </button>
              </span>
            ) : (
              <button
                onClick={() => loadMore?.()}
                disabled={loading}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: theme === 'dark' ? '#A3A3A3' : '#737373',
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {loading ? strings.loading : strings.loadMoreComments}
              </button>
            )}
          </div>
        )}
        {showFetchingSkeletons && <FetchingCommentsSkeletons />}
        {showLoadError && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <p style={{ fontSize: 14, color: mutedColor, margin: "0 0 4px 0" }}>
              {strings.loadCommentsFailed}
            </p>
            <button onClick={() => loadMore?.()} style={tryAgainStyle}>
              {strings.tryAgain}
            </button>
          </div>
        )}
        {showNoComments && (customNoCommentsView ?? <NoCommentsPlaceHolder />)}
      </div>
    );
  }
);

export default CommentsFeed;
