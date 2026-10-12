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
              paddingBottom: 8,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowAll(true)}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 9999,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  lineHeight: 16,
                  fontWeight: '500',
                  color: theme === 'dark' ? '#60A5FA' : '#2563EB',
                }}
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
              paddingVertical: 8,
            }}
          >
            {showLoadMoreError ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    lineHeight: 16,
                    color: mutedTextColor,
                  }}
                >
                  Couldn't load more ·{" "}
                </Text>
                <TouchableOpacity onPress={() => loadMore?.()}>
                  <Text
                    style={{
                      fontSize: 12,
                      lineHeight: 16,
                      fontWeight: '500',
                      color: linkTextColor,
                    }}
                  >
                    Try again
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => loadMore?.()}
                disabled={loading}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 9999,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    lineHeight: 16,
                    fontWeight: '500',
                    color: theme === 'dark' ? '#60A5FA' : '#2563EB',
                  }}
                >
                  {loading ? "Loading..." : "Load more comments"}
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
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 4,
                color: mutedTextColor,
              }}
            >
              Couldn't load comments
            </Text>
            <TouchableOpacity onPress={() => loadMore?.()}>
              <Text
                style={{
                  fontSize: 12,
                  lineHeight: 16,
                  fontWeight: '500',
                  color: linkTextColor,
                }}
              >
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
