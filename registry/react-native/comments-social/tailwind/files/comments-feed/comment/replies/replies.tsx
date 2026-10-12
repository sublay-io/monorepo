import { useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { useReplies, useCommentSection } from "@sublay/react-native";
import { CommentSkeleton } from "~shared/react-native/skeleton";
import useUIState from "../../../../hooks/use-ui-state";
import Comment from "../comment";
import ShowHideButton from "./show-hide-button";

function Replies({ commentId }: { commentId: string }) {
  const { theme } = useUIState();
  const { highlightedComment } = useCommentSection();

  // Replies load on click, 5 at a time (no nesting in this component). The
  // parent comment comes from useReplies too.
  const { comment, replies, newReplies, loading, error, hasMore, loadMore } =
    useReplies({ commentId, limit: 5 });

  // Reply on a reply goes to this top-level comment, which the server refuses
  // once it's deleted, removed or unavailable to the viewer — so its replies
  // show no Reply button then.
  const parentClosed =
    !!comment?.userDeletedAt ||
    comment?.moderationStatus === "removed" ||
    !!comment?.isUnavailable;

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

  const newRepliesList = (
    <FlatList
      data={newReplies}
      renderItem={({ item }) => (
        <Comment
          comment={item}
          extraLeftPadding={42}
          parentClosed={parentClosed}
        />
      )}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View className="h-2" />}
      keyboardShouldPersistTaps="always"
    />
  );

  const oldRepliesList = (
    <FlatList
      data={filteredReplies}
      renderItem={({ item }) => (
        <Comment
          comment={item}
          extraLeftPadding={42}
          parentClosed={parentClosed}
        />
      )}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View className="h-2" />}
      keyboardShouldPersistTaps="always"
    />
  );

  const someRepliesShow =
    newReplies.length > 0 ||
    highlightedComment?.parentComment?.id === commentId ||
    (areRepliesVisible && filteredReplies.length > 0) ||
    loading;

  if (!comment || (comment.repliesCount === 0 && newReplies.length === 0))
    return null;

  return (
    <View>
      {someRepliesShow && (
        <View className="pt-2 flex-col gap-2">
          {/* New replies should always show */}
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
        </View>
      )}

      {/* If replies are fetched we show the skeleton */}
      {loading && (
        <FlatList
          data={Array.from(
            {
              length: Math.min(
                5,
                comment.repliesCount - newReplies.length - filteredReplies.length
              ),
            },
            (_, index) => index + 1
          )}
          renderItem={() => <CommentSkeleton theme={theme} />}
          keyExtractor={(item) => String(item)}
          ItemSeparatorComponent={() => <View className="h-2" />}
          style={{ paddingLeft: 42, paddingRight: 16 }}
          keyboardShouldPersistTaps="always"
        />
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
        failed={!!error && !loading}
        onLoadMore={handleLoadMore}
        areRepliesVisible={areRepliesVisible}
        setAreRepliesVisible={setAreRepliesVisible}
      />
    </View>
  );
}

export default Replies;
export { Replies };
