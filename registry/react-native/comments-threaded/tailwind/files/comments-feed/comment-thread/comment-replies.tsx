import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Comment as CommentType } from "@sublay/react-native";
import { CommentThreadProps } from "./comment-thread";
import useUIState from "../../../hooks/use-ui-state";
import IndentationThreadingLines, {
  INDENT,
  MAX_INDENT_DEPTH,
} from "./single-comment/indentation-threading-lines";
import strings from "../../../utils/strings";

// 🎨 CUSTOMIZATION: "More replies" row - space above it (Default: 12)
const LOAD_MORE_PADDING_TOP = 12;
// 🎨 CUSTOMIZATION: "More replies" row - height (Default: 21).
// The row's text has a line height of 14, plus 3.5 of padding above and below.
const LOAD_MORE_HEIGHT = 21;
// 🎨 CUSTOMIZATION: "More replies" row - space between the elbow and the button (Default: 4)
const LOAD_MORE_OFFSET_START = 4;

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

  // "N more replies": the replies not shown yet, whether some are listed
  // above or none have loaded (below the levels the first page brings)
  const loadMoreLabel =
    hiddenRepliesCount > 0
      ? strings.moreReplyCount(hiddenRepliesCount)
      : strings.moreReplies;

  return (
    // Replies sit one level in from their parent, until the indentation cap
    <View style={{ marginStart: depth < MAX_INDENT_DEPTH ? INDENT : 0 }}>
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
            paddingStart: LOAD_MORE_OFFSET_START,
            marginStart: depth < MAX_INDENT_DEPTH ? 0 : INDENT,
          }}
        >
          <IndentationThreadingLines
            isLastReply={!columnContinues}
            joinAt={LOAD_MORE_PADDING_TOP + LOAD_MORE_HEIGHT / 2}
            reach={LOAD_MORE_OFFSET_START}
          />
          {failed && !loading ? (
            <View className="flex-row items-center px-2 py-1">
              <Text
                className={`text-[13px] leading-4 ${
                  theme === 'dark' ? 'text-neutral-400' : 'text-gray-500'
                }`}
              >
                {strings.loadMoreFailed} ·{" "}
              </Text>
              <TouchableOpacity onPress={onLoadMore}>
                <Text
                  className={`text-[13px] leading-4 font-medium ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  {strings.tryAgain}
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
                {loading ? strings.loading : loadMoreLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default CommentReplies;
