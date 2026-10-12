import { ReactNode, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useCommentSection } from "@sublay/react-native";
import NoCommentsPlaceHolder from "./no-comments-placeholder";
import FetchingCommentsSkeletons from "./fetching-comments-skeletons";
import LoadedComments from "./loaded-comments";
import useUIState from "../../hooks/use-ui-state";

const CommentsFeed = ({
  children: customNoCommentsView,
}: {
  children?: ReactNode;
}) => {
  const { comments, newComments, loading, error, loadMore, highlightedComment } =
    useCommentSection();
  const { theme } = useUIState();

  const mergedComments = useMemo(() => {
    let combinedComments = [...(newComments ?? []), ...(comments ?? [])];

    if (highlightedComment) {
      const { comment, parentComment } = highlightedComment;
      combinedComments = combinedComments.filter(
        (item) => item.id !== comment.id && item.id !== parentComment?.id
      );
    }

    return combinedComments;
  }, [comments, newComments, highlightedComment]);

  const showLoadedComments = mergedComments.length > 0 || highlightedComment;
  const showFetchingSkeletons =
    loading && mergedComments.length === 0 && !highlightedComment;

  // If fetching is done and no comments;
  // Also, because we filter the highlghted comment when it is showing, then we need to make sure this isn't the case here, and show no comments when actually there is one comment - the highlighted one
  const showNoComments =
    !loading && !error && mergedComments.length === 0 && !highlightedComment;

  // A failed load shows a retry; `loadMore()` re-sends the request that failed.
  const showLoadError =
    !loading && !!error && mergedComments.length === 0 && !highlightedComment;
  const mutedColor = theme === 'dark' ? '#A3A3A3' : '#737373';

  return (
    <View style={{ flex: 1 }}>
      {showLoadedComments && <LoadedComments data={mergedComments} />}
      {showFetchingSkeletons && <FetchingCommentsSkeletons />}
      {showLoadError && (
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ fontSize: 14, color: mutedColor, marginBottom: 4 }}>
            Couldn't load comments
          </Text>
          <TouchableOpacity onPress={() => loadMore?.()}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: mutedColor }}>
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {showNoComments && (customNoCommentsView ?? <NoCommentsPlaceHolder />)}
    </View>
  );
};

export default CommentsFeed;
