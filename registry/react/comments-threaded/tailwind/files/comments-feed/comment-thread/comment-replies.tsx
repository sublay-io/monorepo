import React, { useContext } from "react";
import { Comment as CommentType } from "@sublay/react-js";
import { CommentThreadProps } from "./comment-thread";
import IndentationThreadingLines, {
  INDENT,
  MAX_INDENT_DEPTH,
  ThreadLineContext,
} from "./single-comment/indentation-threading-lines";
import strings from "../../../utils/strings";

// 🎨 CUSTOMIZATION: "More replies" row - space above it (Default: 12px)
const LOAD_MORE_PADDING_TOP = 12;
// 🎨 CUSTOMIZATION: "More replies" row - height (Default: 24px)
const LOAD_MORE_HEIGHT = 24;
// 🎨 CUSTOMIZATION: "More replies" row - space between the elbow and the button (Default: 4px)
const LOAD_MORE_OFFSET_START = 4;

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
  CommentThreadComponent,
}: CommentRepliesProps) {
  // The comment's line: the load-more row hangs from it, so it lights up with it
  const line = useContext(ThreadLineContext);

  // Don't render anything if collapsed, or if there are no replies to show or load
  if (isCollapsed || (visibleReplies.length === 0 && !hasMore)) {
    return null;
  }

  // "N more replies": the replies not shown yet, whether some are listed
  // above or none have loaded (below the levels the first page brings)
  const loadMoreLabel =
    hiddenRepliesCount > 0
      ? strings.moreReplyCount(hiddenRepliesCount)
      : strings.moreReplies;

  return (
    // Replies sit one level in from their parent, until the indentation cap
    <div style={{ marginInlineStart: depth < MAX_INDENT_DEPTH ? `${INDENT}px` : 0 }}>
      {visibleReplies.map((reply: CommentType, index: number) => (
        <CommentThreadComponent
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          // The load-more row below, when there is one, is the last row on the line
          isLastReply={index === visibleReplies.length - 1 && !hasMore}
        />
      ))}

      {/* Load more replies button (or a retry after a failed load) */}
      {hasMore && (
        // Always the last row under its parent. Past the indentation cap it
        // still steps in one level, so it reads as a branch off the column.
        <div
          className="relative flex items-center box-content"
          style={{
            minHeight: `${LOAD_MORE_HEIGHT}px`,
            paddingTop: `${LOAD_MORE_PADDING_TOP}px`,
            paddingInlineStart: `${LOAD_MORE_OFFSET_START}px`,
            marginInlineStart: depth < MAX_INDENT_DEPTH ? 0 : `${INDENT}px`,
          }}
        >
          <IndentationThreadingLines
            // Part of the comment's line: it lights up with it
            line={line}
            isLastReply
            joinAt={LOAD_MORE_PADDING_TOP + LOAD_MORE_HEIGHT / 2}
            reach={LOAD_MORE_OFFSET_START}
          />
          {failed && !loading ? (
            <div className="text-[13px] text-gray-500 dark:text-neutral-400 px-2 py-1">
              {strings.loadMoreFailed} ·{" "}
              <button
                onClick={onLoadMore}
                className="text-[13px] font-medium text-blue-600 dark:text-blue-400 p-0 bg-transparent border-none cursor-pointer hover:underline"
              >
                {strings.tryAgain}
              </button>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="flex items-center gap-2 text-[13px] text-blue-600 dark:text-blue-400 font-medium transition-all duration-150 px-2 py-1 rounded-full bg-transparent border-none cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-400/10"
            >
              <svg
                className="w-3 h-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              {loading ? strings.loading : loadMoreLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CommentReplies;
