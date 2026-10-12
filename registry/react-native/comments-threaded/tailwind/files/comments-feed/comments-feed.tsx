import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useCommentSection } from "@sublay/react-native";
import LoadedComments from "./loaded-comments";
import FetchingCommentsSkeletons from "./fetching-comments-skeletons";
import NoCommentsPlaceHolder from "./no-comments-placeholder";
import useUIState from "../../hooks/use-ui-state";

const CommentsFeed = React.memo(
  ({ children: customNoCommentsView }: { children?: ReactNode }) => {
    const {
      comments,
      newComments,
      loading,
      error,
      hasMore,
      loadMore,
      highlightedComment,
      highlightedCommentLoading,
    } = useCommentSection();
    const { theme } = useUIState();

    // Whether the viewer left the focused thread for the full view. Reset
    // whenever the highlighted comment changes (including X → none → X), so a
    // fresh deep link always opens focused.
    const [showAll, setShowAll] = useState(false);
    const highlightedId = highlightedComment?.comment.id ?? null;
    const [prevHighlightedId, setPrevHighlightedId] = useState(highlightedId);
    if (highlightedId !== prevHighlightedId) {
      setPrevHighlightedId(highlightedId);
      setShowAll(false);
    }

    // Deep link: only the highlighted comment's thread — its parent (or the
    // comment itself when it's top-level), with the normal replies under it.
    const focused = highlightedComment && !showAll ? highlightedComment : null;

    // A new top-level comment posted from the focused view switches to the
    // full view, so the viewer sees it. Replies stay in the focused thread.
    const newCommentsCount = newComments?.length ?? 0;
    const prevNewCommentsCount = useRef(newCommentsCount);
    useEffect(() => {
      if (focused && newCommentsCount > prevNewCommentsCount.current) {
        setShowAll(true);
      }
      prevNewCommentsCount.current = newCommentsCount;
    }, [newCommentsCount, focused]);

    const mergedComments = useMemo(
      () => [...(newComments ?? []), ...(comments ?? [])],
      [comments, newComments]
    );

    // While the highlighted comment loads, show the loading state rather than
    // the full list, so the section doesn't switch from the list to the
    // focused thread once it arrives.
    if (highlightedCommentLoading) {
      return (
        <View className="flex-1">
          <FetchingCommentsSkeletons />
        </View>
      );
    }

    if (focused) {
      return (
        <View className="flex-1">
          <View className="items-start pb-2">
            <TouchableOpacity
              onPress={() => setShowAll(true)}
              className="px-2 py-1 rounded-full"
            >
              <Text
                className={`text-xs font-medium ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}
              >
                View all comments
              </Text>
            </TouchableOpacity>
          </View>
          <LoadedComments data={[focused.parentComment ?? focused.comment]} />
        </View>
      );
    }

    const showLoadedComments = mergedComments.length > 0;
    const showFetchingSkeletons = loading && mergedComments.length === 0;
    // A failed load shows a retry; `loadMore()` re-sends the request that failed.
    const showLoadError = !loading && !!error && mergedComments.length === 0;
    const showNoComments = !loading && !error && mergedComments.length === 0;
    const showLoadMoreError = !loading && !!error;
    const mutedTextClass = theme === 'dark' ? 'text-neutral-400' : 'text-gray-500';
    const linkTextClass = theme === 'dark' ? 'text-blue-400' : 'text-blue-600';

    return (
      <View className="flex-1">
        {showLoadedComments && <LoadedComments data={mergedComments} />}
        {showLoadedComments && hasMore && (
          <View className="items-center py-2">
            {showLoadMoreError ? (
              <View className="flex-row items-center px-3 py-1">
                <Text className={`text-xs ${mutedTextClass}`}>
                  Couldn't load more ·{" "}
                </Text>
                <TouchableOpacity onPress={() => loadMore?.()}>
                  <Text className={`text-xs font-medium ${linkTextClass}`}>
                    Try again
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => loadMore?.()}
                disabled={loading}
                className="px-3 py-1 rounded-full"
              >
                <Text
                  className={`text-xs font-medium ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  {loading ? "Loading..." : "Load more comments"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {showFetchingSkeletons && <FetchingCommentsSkeletons />}
        {showLoadError && (
          <View className="items-center py-2">
            <Text className={`text-sm mb-1 ${mutedTextClass}`}>
              Couldn't load comments
            </Text>
            <TouchableOpacity onPress={() => loadMore?.()}>
              <Text className={`text-xs font-medium ${linkTextClass}`}>
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {showNoComments && (customNoCommentsView ?? <NoCommentsPlaceHolder />)}
      </View>
    );
  }
);

CommentsFeed.displayName = "CommentsFeed";

export default CommentsFeed;
