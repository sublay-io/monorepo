import React, { useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { useReplies, useCommentSection } from "@sublay/react-native";
import { CommentSkeleton } from "~shared/react-native/skeleton";
import useUIState from "../../../../hooks/use-ui-state";
// Type only: the component itself comes in as a prop, so comment.tsx (which
// renders Replies) and this file don't import each other at runtime
import type CommentRow from "../comment";
import ShowHideButton from "./show-hide-button";

function Replies({
  commentId,
  CommentComponent,
}: {
  commentId: string;
  // The comment row (comment.tsx passes itself)
  CommentComponent: React.ComponentType<React.ComponentProps<typeof CommentRow>>;
}) {
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

  // 🎨 CUSTOMIZATION: Replies styling defaults
  const repliesGap = 8;
  const repliesPaddingTop = 8;


  const filteredReplies = useMemo(() => {
    return replies.filter((c) => c.id !== highlightedComment?.comment.id);
  }, [replies, highlightedComment]);

  const newRepliesList = (
    <FlatList
      data={newReplies}
      renderItem={({ item }) => (
        <CommentComponent
          comment={item}
          extraLeftPadding={42}
          parentClosed={parentClosed}
        />
      )}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View style={{ height: repliesGap }} />}
      keyboardShouldPersistTaps="always"
    />
  );

  const oldRepliesList = (
    <FlatList
      data={filteredReplies}
      renderItem={({ item }) => (
        <CommentComponent
          comment={item}
          extraLeftPadding={42}
          parentClosed={parentClosed}
        />
      )}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View style={{ height: repliesGap }} />}
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
        <View
          style={{
            paddingTop: repliesPaddingTop,
            flexDirection: "column",
            gap: repliesGap,
          }}
        >
          {/* New replies should always show */}
          {newRepliesList}

          {/* Highlighted reply */}
          {highlightedComment &&
            highlightedComment.parentComment?.id === commentId && (
              <CommentComponent
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
          // Indented, sized and spaced like the replies they stand in for
          renderItem={() => (
            <CommentSkeleton theme={theme} extraLeftPadding={42} />
          )}
          keyExtractor={(item) => String(item)}
          ItemSeparatorComponent={() => <View style={{ height: 28 }} />}
          style={{
            // The first reply's own top padding, plus the gap after the
            // replies already listed
            paddingTop: areRepliesVisible && filteredReplies.length > 0 ? 16 : 8,
            paddingBottom: 12,
            paddingEnd: 46,
          }}
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
