import { View } from "react-native";
import { FlatList } from "react-native";
import { Comment as CommentType, useCommentSection } from "@sublay/react-native";
import { Comment } from "./comment";
import CommentsFooterComponent from "./comments-footer-component";

const LoadedComments = ({ data }: { data: CommentType[] }) => {
  const { loadMore, error, highlightedComment } = useCommentSection();

  // 🎨 CUSTOMIZATION: Comments gap (spacing between comments)
  const commentsGap = 7;

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <Comment comment={item} />}
      ListHeaderComponent={
        highlightedComment ? (
          <Comment
            comment={
              highlightedComment.parentComment ?? highlightedComment.comment
            }
          />
        ) : null
      }
      ListHeaderComponentStyle={{ paddingBottom: commentsGap }}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View style={{ height: commentsGap }} />}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 24 }}
      keyboardShouldPersistTaps="always"
      // After a failed load only the "Try again" row retries: reaching the
      // end again must not re-send the request on its own.
      onEndReached={() => data.length > 0 && !error && loadMore!()}
      onEndReachedThreshold={0}
      ListFooterComponent={<CommentsFooterComponent />}
    />
  );
};

export default LoadedComments;
