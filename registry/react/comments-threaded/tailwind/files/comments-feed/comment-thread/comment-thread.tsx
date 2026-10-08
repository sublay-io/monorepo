import { useMemo, useState } from "react";
import { Comment as CommentType, useReplies } from "@sublay/react-js";
import SingleComment from "./single-comment";
import CommentReplies from "./comment-replies";

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
  const { replies, newReplies, loading, hasMore, loadMore } = useReplies({
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

  return (
    <>
      <SingleComment
        comment={comment}
        depth={depth}
        hasReplies={hasReplies}
        isCollapsed={isCollapsed}
        replyCount={replyCount}
        isLastReply={isLastReply}
        onToggleCollapse={handleToggleCollapse}
      />

      <CommentReplies
        depth={depth}
        isCollapsed={isCollapsed}
        loading={loading}
        visibleReplies={allReplies}
        hiddenRepliesCount={hiddenRepliesCount}
        hasMore={hasMore}
        onLoadMore={() => loadMore()}
        CommentThreadComponent={CommentThread}
      />
    </>
  );
}

export default CommentThread;
