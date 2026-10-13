import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
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
          className="flex-row items-center"
          style={{
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
            <View className="flex-row items-center px-2 py-1">
              <Text
                className={`text-[13px] leading-4 ${
                  theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
                }`}
              >
                Couldn't load more ·{" "}
              </Text>
              <TouchableOpacity onPress={onLoadMore}>
                <Text
                  className={`text-[13px] leading-4 font-medium ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  Try again
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              // Dim only a little, so the pressed tint shows
              activeOpacity={0.6}
              onPress={onLoadMore}
              disabled={loading}
              className={`flex-row items-center gap-2 px-2 py-1 rounded-full ${
                theme === 'dark' ? 'active:bg-blue-400/10' : 'active:bg-blue-50'
              }`}
            >
              <Text
                className={`text-[13px] leading-4 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}
              >
                +
              </Text>
              <Text
                className={`text-[13px] leading-4 font-medium ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}
              >
                {loading ? "Loading..." : loadMoreLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default CommentReplies;
