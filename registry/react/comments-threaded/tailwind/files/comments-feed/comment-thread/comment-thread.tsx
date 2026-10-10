import { useMemo, useState } from "react";
import { Comment as CommentType, useReplies } from "@sublay/react-js";
import SingleComment from "./single-comment";
import CommentReplies from "./comment-replies";
import IndentationThreadingLines, {
  MAX_INDENT_DEPTH,
} from "./single-comment/indentation-threading-lines";

export interface CommentThreadProps {
  comment: CommentType;
  depth: number;
  isLastReply?: boolean;
  onDeleteComment?: (commentId: string) => void;
  onReportComment?: (commentId: string) => void;
}

function CommentThread({
  comment,
  depth,
  isLastReply = false,
}: CommentThreadProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Replies the section already brought in (nested) are here from the start;
  // "load more" / "continue this thread" fetch the rest on demand.
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

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const hasReplies = allReplies.length > 0;
  // Whether anything is listed under this comment: replies, or the row that loads them.
  const showReplies = !isCollapsed && (hasReplies || hasMore);

  return (
    // The wrapper spans the comment and everything nested under it, which is
    // what the threading lines measure themselves against.
    <div className="relative">
      <SingleComment
        comment={comment}
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

      {/* Threading lines connecting this comment to its parent */}
      {depth > 0 && (
        <IndentationThreadingLines
          isLastReply={isLastReply}
          indented={depth <= MAX_INDENT_DEPTH}
        />
      )}
    </div>
  );
}

export default CommentThread;
