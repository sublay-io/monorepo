import React from "react";
import { Comment as CommentType } from "@sublay/react-js";
import { CommentThreadProps } from "./comment-thread";
import useUIState from "../../../hooks/use-ui-state";

interface CommentRepliesProps {
  depth: number;
  isCollapsed: boolean;
  loading: boolean;
  visibleReplies: CommentType[];
  hiddenRepliesCount: number;
  hasMore: boolean;
  onLoadMore: () => void;
  onDeleteComment?: (commentId: string) => void;
  onReportComment?: (commentId: string) => void;
  CommentThreadComponent: React.ComponentType<CommentThreadProps>;
}

function CommentReplies({
  depth,
  isCollapsed,
  loading,
  visibleReplies,
  hiddenRepliesCount,
  hasMore,
  onLoadMore,
  onDeleteComment,
  onReportComment,
  CommentThreadComponent,
}: CommentRepliesProps) {
  const { theme } = useUIState();

  // Don't render anything if collapsed, or if there are no replies to show or load
  if (isCollapsed || (visibleReplies.length === 0 && !hasMore)) {
    return null;
  }

  // At the depth boundary nothing is loaded yet: the replies load right here.
  const loadMoreLabel =
    visibleReplies.length === 0
      ? "Continue this thread"
      : hiddenRepliesCount > 0
      ? `${hiddenRepliesCount} more ${hiddenRepliesCount === 1 ? "reply" : "replies"}`
      : "More replies";

  return (
    <div
    // style={{ marginTop: "8px" }}
    >
      {/* {loading && (
        <div
          style={{ fontSize: "12px", color: "#6B7280", marginBottom: "8px" }}
        >
          Loading replies...
        </div>
      )} */}

      {visibleReplies.map((reply: CommentType, index: number) => (
        <CommentThreadComponent
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          isLastReply={index === visibleReplies.length - 1}
          onDeleteComment={onDeleteComment}
          onReportComment={onReportComment}
        />
      ))}

      {/* Load more replies button */}
      {hasMore && (
        // Indented to the level the replies load at (same 24px-per-level cap as single comments)
        <div style={{ marginTop: "12px", marginLeft: `${Math.min(depth + 1, 6) * 24 + 4}px` }}>
          <button
            onClick={onLoadMore}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: theme === 'dark' ? "#3B82F6" : "#2563EB",
              fontWeight: "500",
              transition: "all 150ms ease-in-out",
              padding: "4px 8px",
              borderRadius: "9999px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme === 'dark' ? "#2563EB" : "#1D4ED8";
              e.currentTarget.style.backgroundColor = theme === 'dark' ? "#1E3A8A" : "#EFF6FF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = theme === 'dark' ? "#3B82F6" : "#2563EB";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <svg
              style={{ width: "12px", height: "12px" }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            {loading ? "Loading..." : loadMoreLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export default CommentReplies;
