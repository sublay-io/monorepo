import { useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  Comment as CommentType,
  useCommentSection,
  useReplies,
} from "@sublay/react-js";
import SingleComment from "./single-comment";
import CommentReplies from "./comment-replies";
import IndentationThreadingLines, {
  MAX_INDENT_DEPTH,
  ThreadLine,
  ThreadLineContext,
} from "./single-comment/indentation-threading-lines";

export interface CommentThreadProps {
  comment: CommentType;
  depth: number;
  isLastReply?: boolean;
}

function CommentThread({
  comment,
  depth,
  isLastReply = false,
}: CommentThreadProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { highlightedComment } = useCommentSection();

  // Replies the section already brought in (nested) are here from the start;
  // "load more" / "N more replies" fetch the rest on demand.
  const { replies, newReplies, loading, error, hasMore, loadMore } = useReplies({
    commentId: comment.id,
  });

  const allReplies = useMemo(
    () => [...(newReplies || []), ...(replies || [])],
    [newReplies, replies]
  );

  // Counts come from repliesCount; the button is driven by hasMore.
  const replyCount = Math.max(comment.repliesCount ?? 0, allReplies.length);
  const hiddenRepliesCount = Math.max(0, replyCount - allReplies.length);

  // This comment's line: hovering it (or the circle on it) lights it and its
  // direct replies' elbows; clicking it collapses or expands the comment
  const [isLineHovered, setIsLineHovered] = useState(false);
  // The line this comment hangs from: its connector belongs to the parent
  const parentLine = useContext(ThreadLineContext);
  const focusCircleOnMount = useRef(false);

  const handleToggleCollapse = useCallback(() => {
    // The line goes away when collapsing, so the mouse never "leaves" it
    setIsLineHovered(false);
    setIsCollapsed((collapsed) => !collapsed);
  }, []);

  const line: ThreadLine = useMemo(
    () => ({
      hovered: isLineHovered,
      setHovered: setIsLineHovered,
      toggle: handleToggleCollapse,
      focusCircleOnMount,
    }),
    [isLineHovered, handleToggleCollapse]
  );

  const hasReplies = allReplies.length > 0;
  // Whether anything is listed under this comment: replies, or the row that loads them.
  const showReplies = !isCollapsed && (hasReplies || hasMore);

  // The comment and its replies, kept the same while only the line's hover
  // changes: the line pieces read it from context, so hovering doesn't render
  // the whole thread again
  const content = useMemo(
    () => (
      <>
        <SingleComment
          comment={comment}
          depth={depth}
          hasReplies={hasReplies}
          isCollapsed={isCollapsed}
          replyCount={replyCount}
          showReplies={showReplies}
          onToggleCollapse={handleToggleCollapse}
        />

        <CommentReplies
          depth={depth}
          isCollapsed={isCollapsed}
          loading={loading}
          failed={!!error}
          visibleReplies={allReplies}
          hiddenRepliesCount={hiddenRepliesCount}
          hasMore={hasMore}
          onLoadMore={() => loadMore()}
          CommentThreadComponent={CommentThread}
        />
      </>
    ),
    [
      comment,
      depth,
      hasReplies,
      isCollapsed,
      replyCount,
      showReplies,
      handleToggleCollapse,
      loading,
      error,
      allReplies,
      hiddenRepliesCount,
      hasMore,
      loadMore,
    ]
  );

  return (
    // The wrapper spans the comment and everything nested under it, which is
    // what the threading lines measure themselves against.
    <div className="relative">
      <ThreadLineContext.Provider value={line}>
        {content}
      </ThreadLineContext.Provider>

      {/* Threading lines connecting this comment to its parent */}
      {depth > 0 && (
        <IndentationThreadingLines
          isLastReply={isLastReply}
          indented={depth <= MAX_INDENT_DEPTH}
          highlighted={highlightedComment?.comment.id === comment.id}
          line={parentLine}
        />
      )}
    </div>
  );
}

export default CommentThread;
