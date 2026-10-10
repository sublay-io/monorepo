import React from "react";
import { Comment as CommentType } from "@sublay/react-js";
import { CommentThreadProps } from "./comment-thread";
import useUIState from "../../../hooks/use-ui-state";
import IndentationThreadingLines, {
  INDENT,
  MAX_INDENT_DEPTH,
} from "./single-comment/indentation-threading-lines";

// 🎨 CUSTOMIZATION: "More replies" row - space above it (Default: 12px)
const LOAD_MORE_PADDING_TOP = 12;
// 🎨 CUSTOMIZATION: "More replies" row - height (Default: 24px)
const LOAD_MORE_HEIGHT = 24;
// 🎨 CUSTOMIZATION: "More replies" row - space between the elbow and the button (Default: 4px)
const LOAD_MORE_OFFSET_LEFT = 4;

interface CommentRepliesProps {
  depth: number;
  isCollapsed: boolean;
  loading: boolean;
  /** The last replies load failed: show a retry in place of the button. */
  failed: boolean;
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
  failed,
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
    // Replies sit one level in from their parent, until the indentation cap
    <div style={{ marginLeft: depth < MAX_INDENT_DEPTH ? `${INDENT}px` : 0 }}>

      {visibleReplies.map((reply: CommentType, index: number) => (
        <CommentThreadComponent
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          // The load-more row below, when there is one, is the last row on the line
          isLastReply={index === visibleReplies.length - 1 && !hasMore}
          onDeleteComment={onDeleteComment}
          onReportComment={onReportComment}
        />
      ))}

      {/* Load more replies button (or a retry after a failed load) */}
      {hasMore && (
        // Always the last row under its parent. Past the indentation cap it
        // still steps in one level, so it reads as a branch off the column.
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            boxSizing: "content-box",
            minHeight: `${LOAD_MORE_HEIGHT}px`,
            paddingTop: `${LOAD_MORE_PADDING_TOP}px`,
            paddingLeft: `${LOAD_MORE_OFFSET_LEFT}px`,
            marginLeft: depth < MAX_INDENT_DEPTH ? 0 : `${INDENT}px`,
          }}
        >
          <IndentationThreadingLines
            isLastReply
            joinAt={LOAD_MORE_PADDING_TOP + LOAD_MORE_HEIGHT / 2}
            reach={LOAD_MORE_OFFSET_LEFT}
          />
          {failed && !loading ? (
            <div
              style={{
                fontSize: "12px",
                color: theme === "dark" ? "#9CA3AF" : "#6B7280",
                padding: "4px 8px",
              }}
            >
              Couldn't load more ·{" "}
              <button
                onClick={onLoadMore}
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: theme === "dark" ? "#3B82F6" : "#2563EB",
                  padding: 0,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            </div>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}

export default CommentReplies;
