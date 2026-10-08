import React, { ReactNode, useMemo } from "react";
import { useCommentSection } from "@sublay/react-js";
import LoadedComments from "./loaded-comments";
import FetchingCommentsSkeletons from "./fetching-comments-skeletons";
import NoCommentsPlaceHolder from "./no-comments-placeholder";
import useUIState from "../../hooks/use-ui-state";

const CommentsFeed = React.memo(
  ({ children: customNoCommentsView }: { children?: ReactNode }) => {
    const { comments, newComments, loading, hasMore, loadMore, highlightedComment } =
      useCommentSection();
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
      !loading && mergedComments.length === 0 && !highlightedComment;

    return (
      <div style={{ flex: 1 }}>
        {showLoadedComments && <LoadedComments data={mergedComments} />}
        {showLoadedComments && hasMore && (
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
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
          </div>
        )}
        {showFetchingSkeletons && <FetchingCommentsSkeletons />}
        {showNoComments && (customNoCommentsView ?? <NoCommentsPlaceHolder />)}
      </div>
    );
  }
);

export default CommentsFeed;
