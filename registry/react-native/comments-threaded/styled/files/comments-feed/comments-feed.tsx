import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useCommentSection } from "@sublay/react-native";
import LoadedComments from "./loaded-comments";
import FetchingCommentsSkeletons from "./fetching-comments-skeletons";
import NoCommentsPlaceHolder from "./no-comments-placeholder";
import useUIState from "../../hooks/use-ui-state";
import strings from "../../utils/strings";

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
        <View style={{ flex: 1 }}>
          <FetchingCommentsSkeletons />
        </View>
      );
    }

    if (focused) {
      return (
        <View style={{ flex: 1 }}>
          <View
            style={{
              alignItems: 'flex-start',
              paddingBottom: 7,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowAll(true)}
              style={{
                paddingHorizontal: 7,
                paddingVertical: 3.5,
                borderRadius: 9999,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 18,
                  fontWeight: '500',
                  color: theme === 'dark' ? '#60A5FA' : '#2563EB',
                }}
              >
                {strings.viewAllComments}
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
    // 🎨 CUSTOMIZATION: Muted text and link colors
    const mutedTextColor = theme === 'dark' ? '#A3A3A3' : '#6B7280';
    const linkTextColor = theme === 'dark' ? '#60A5FA' : '#2563EB';

    return (
      <View style={{ flex: 1 }}>
        {showLoadedComments && <LoadedComments data={mergedComments} />}
        {showLoadedComments && hasMore && (
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 7,
            }}
          >
            {showLoadMoreError ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 10.5,
                  paddingVertical: 3.5,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 18,
                    color: mutedTextColor,
                  }}
                >
                  {strings.loadMoreFailed} ·{" "}
                </Text>
                <TouchableOpacity onPress={() => loadMore?.()}>
                  <Text
                    style={{
                      fontSize: 13,
                      lineHeight: 18,
                      fontWeight: '500',
                      color: linkTextColor,
                    }}
                  >
                    {strings.tryAgain}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => loadMore?.()}
                disabled={loading}
                style={{
                  paddingHorizontal: 10.5,
                  paddingVertical: 3.5,
                  borderRadius: 9999,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 18,
                    fontWeight: '500',
                    color: theme === 'dark' ? '#60A5FA' : '#2563EB',
                  }}
                >
                  {loading ? strings.loading : strings.loadMoreComments}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {showFetchingSkeletons && <FetchingCommentsSkeletons />}
        {showLoadError && (
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 7,
            }}
          >
            <Text
              style={{
                fontSize: 12.25,
                lineHeight: 17.5,
                marginBottom: 3.5,
                color: mutedTextColor,
              }}
            >
              {strings.loadCommentsFailed}
            </Text>
            <TouchableOpacity onPress={() => loadMore?.()}>
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 18,
                  fontWeight: '500',
                  color: linkTextColor,
                }}
              >
                {strings.tryAgain}
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
