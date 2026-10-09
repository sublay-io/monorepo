import { useMemo, useState } from "react";
import { useReplies, useCommentSection } from "@sublay/react-js";
import { CommentSkeleton } from "@sublay/ui-core-react-js";

import Comment from "../comment";
import ShowHideButton from "./show-hide-button";

export function Replies({ commentId }: { commentId: string }) {
  const { highlightedComment } = useCommentSection();

  // Replies load on click, 5 at a time (no nesting in this component). The
  // parent comment comes from useReplies too.
  const { comment, replies, newReplies, loading, hasMore, loadMore } =
    useReplies({ commentId, limit: 5 });

  // Reply on a reply goes to this top-level comment, which the server refuses
  // once it's deleted or removed — so its replies show no Reply button then.
  const parentClosed =
    !!comment?.userDeletedAt || comment?.moderationStatus === "removed";

  // How many times replies were requested (0 = never expanded).
  const [page, setPage] = useState(0);
  const handleLoadMore = () => {
    setPage((p) => p + 1);
    loadMore();
  };

  const [areRepliesVisible, setAreRepliesVisible] = useState(false);


  const filteredReplies = useMemo(() => {
    return replies.filter((c) => c.id !== highlightedComment?.comment.id);
  }, [replies, highlightedComment]);

  const newRepliesList = newReplies.map((reply) => (
    <Comment
      comment={reply}
      extraLeftPadding={42}
      parentClosed={parentClosed}
      key={reply.id}
    />
  ));

  const oldRepliesList = filteredReplies.map((reply) => (
    <Comment
      comment={reply}
      extraLeftPadding={42}
      parentClosed={parentClosed}
      key={reply.id}
    />
  ));

  const someRepliesShow =
    newReplies.length > 0 ||
    highlightedComment?.parentComment?.id === commentId ||
    (areRepliesVisible && filteredReplies.length > 0) ||
    loading;

  if (!comment || (comment.repliesCount === 0 && newReplies.length === 0))
    return null;

  return (
    <div>
      {someRepliesShow && (
        <div
          style={{
            // 🎨 CUSTOMIZATION: Reply spacing (Default: 12px gap, 8px top padding)
            paddingTop: 8,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* New replies should always show first*/}
          {newRepliesList}

          {/* Highlighted reply */}
          {highlightedComment &&
            highlightedComment.parentComment?.id === commentId && (
              <Comment
                comment={highlightedComment.comment}
                extraLeftPadding={42}
                parentClosed={parentClosed}
              />
            )}

          {/* Old replies should only show if it is set to show */}
          {areRepliesVisible && oldRepliesList}

          {/* If replies are fetched we show the skeleton */}
          {loading &&
            Array.from(
              {
                length: Math.min(
                  5,
                  comment.repliesCount - newReplies.length - filteredReplies.length
                ),
              },
              (_, index) => index + 1
            ).map((i) => <CommentSkeleton extraLeftPadding={42} key={i} />)}
        </div>
      )}

      <ShowHideButton
        // repliesCount includes the viewer's own new replies (shown above), so
        // they're subtracted along with the highlighted reply.
        totalRepliesCount={
          comment.repliesCount -
          newReplies.length -
          (highlightedComment?.parentComment?.id === commentId ? 1 : 0)
        }
        loadedRepliesCount={filteredReplies.length}
        page={page}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        areRepliesVisible={areRepliesVisible}
        setAreRepliesVisible={setAreRepliesVisible}
      />
    </div>
  );
}

export default Replies;
