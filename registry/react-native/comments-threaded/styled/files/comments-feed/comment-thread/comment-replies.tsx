import React from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { Comment as CommentType } from "@sublay/react-native";
import { CommentThreadProps } from "./comment-thread";
import useUIState from "../../../hooks/use-ui-state";
import IndentationThreadingLines, {
  INDENT,
  MAX_INDENT_DEPTH,
} from "./single-comment/indentation-threading-lines";

// 🎨 CUSTOMIZATION: "More replies" row - space above it (Default: 12)
const LOAD_MORE_PADDING_TOP = 12;
// 🎨 CUSTOMIZATION: "More replies" row - height (Default: 24).
// The row's text has a line height of 16, plus 4 of padding above and below.
const LOAD_MORE_HEIGHT = 24;
// 🎨 CUSTOMIZATION: "More replies" row - space between the elbow and the button (Default: 4)
const LOAD_MORE_OFFSET_LEFT = 4;

interface CommentRepliesProps {
  depth: number;
  /** Past the indentation cap, the parent's column carries on below these replies. */
  columnContinues: boolean;
  isCollapsed: boolean;
  loading: boolean;
  /** The last replies load failed: show a retry in place of the button. */
  failed: boolean;
  visibleReplies: CommentType[];
  hiddenRepliesCount: number;
  hasMore: boolean;
  onLoadMore: () => void;
  CommentThreadComponent: React.ComponentType<CommentThreadProps>;
}

function CommentReplies({
  depth,
  columnContinues,
  isCollapsed,
  loading,
  failed,
  visibleReplies,
  hiddenRepliesCount,
  hasMore,
  onLoadMore,
  CommentThreadComponent,
}: CommentRepliesProps) {
  const { theme } = useUIState();

  // Don't render anything if collapsed, or if there are no replies to show or load
  if (isCollapsed || (visibleReplies.length === 0 && !hasMore)) {
    return null;
  }

  // At the depth boundary nothing is loaded yet: the replies load right here.
  const loadMoreLabel =
    visibleReplies.length === 0
      ? "Continue this thread"
      : hiddenRepliesCount > 0
      ? `${hiddenRepliesCount} more ${hiddenRepliesCount === 1 ? "reply" : "replies"}`
      : "More replies";

  return (
    // Replies sit one level in from their parent, until the indentation cap
    <View style={{ marginLeft: depth < MAX_INDENT_DEPTH ? INDENT : 0 }}>
      {visibleReplies.map((reply: CommentType, index: number) => (
        <CommentThreadComponent
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          // The load-more row below, when there is one, is the last row on the line
          isLastReply={index === visibleReplies.length - 1 && !hasMore}
          parentColumnContinues={columnContinues}
        />
      ))}

      {/* Load more replies button (or a retry after a failed load) */}
      {hasMore && (
        // The last row under its parent. Past the indentation cap it still
        // steps in one level, so it reads as a branch off the column.
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: LOAD_MORE_PADDING_TOP + LOAD_MORE_HEIGHT,
            paddingTop: LOAD_MORE_PADDING_TOP,
            paddingLeft: LOAD_MORE_OFFSET_LEFT,
            marginLeft: depth < MAX_INDENT_DEPTH ? 0 : INDENT,
          }}
        >
          <IndentationThreadingLines
            isLastReply={!columnContinues}
            joinAt={LOAD_MORE_PADDING_TOP + LOAD_MORE_HEIGHT / 2}
            reach={LOAD_MORE_OFFSET_LEFT}
          />
          {failed && !loading ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 16,
                  color: theme === 'dark' ? '#A3A3A3' : '#6B7280',
                }}
              >
                Couldn't load more ·{" "}
              </Text>
              <TouchableOpacity onPress={onLoadMore}>
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 16,
                    fontWeight: '500',
                    color: theme === 'dark' ? '#60A5FA' : '#2563EB',
                  }}
                >
                  Try again
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Pressable
              onPress={onLoadMore}
              disabled={loading}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 9999,
                // 🎨 CUSTOMIZATION: Press feedback
                backgroundColor: pressed
                  ? theme === 'dark' ? 'rgba(96, 165, 250, 0.1)' : '#EFF6FF'
                  : 'transparent',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 16,
                  color: theme === 'dark' ? '#60A5FA' : '#2563EB',
                }}
              >
                +
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 16,
                  fontWeight: '500',
                  color: theme === 'dark' ? '#60A5FA' : '#2563EB',
                }}
              >
                {loading ? "Loading..." : loadMoreLabel}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export default CommentReplies;
