import { useMemo, useState } from "react";
import { View } from "react-native";
import {
  Comment as CommentType,
  useCommentSection,
  useReplies,
} from "@sublay/react-native";
import SingleComment from "./single-comment";
import CommentReplies from "./comment-replies";
import IndentationThreadingLines, {
  MAX_INDENT_DEPTH,
} from "./single-comment/indentation-threading-lines";

export interface CommentThreadProps {
  comment: CommentType;
  depth: number;
  isLastReply?: boolean;
  /**
   * Past the indentation cap, the parent's column carries on below the
   * parent's replies (to its next sibling or its load-more row).
   */
  parentColumnContinues?: boolean;
}

function CommentThread({
  comment,
  depth,
  isLastReply = false,
  parentColumnContinues = false,
}: CommentThreadProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { highlightedComment } = useCommentSection();

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

  // Past the indentation cap this comment shares its parent's column. The
  // column's line runs on below this comment's whole thread when another row
  // of that column follows it.
  const columnContinues =
    depth > MAX_INDENT_DEPTH && (!isLastReply || parentColumnContinues);

  return (
    // The wrapper spans the comment and everything nested under it, which is
    // what the threading lines measure themselves against.
    <View>
      <SingleComment
        comment={comment}
        depth={depth}
        hasReplies={hasReplies}
        isCollapsed={isCollapsed}
        replyCount={replyCount}
        showReplies={showReplies}
        columnContinues={columnContinues}
        onToggleCollapse={handleToggleCollapse}
      />

      <CommentReplies
        depth={depth}
        columnContinues={columnContinues}
        isCollapsed={isCollapsed}
        loading={loading}
        failed={!!error}
        visibleReplies={allReplies}
        hiddenRepliesCount={hiddenRepliesCount}
        hasMore={hasMore}
        onLoadMore={() => loadMore()}
        CommentThreadComponent={CommentThread}
      />

      {/* Threading lines connecting this comment to its parent. Last, so
          they draw over a highlighted row's background. */}
      {depth > 0 && (
        <IndentationThreadingLines
          isLastReply={isLastReply}
          indented={depth <= MAX_INDENT_DEPTH}
          highlighted={highlightedComment?.comment.id === comment.id}
        />
      )}
    </View>
  );
}

export default CommentThread;
