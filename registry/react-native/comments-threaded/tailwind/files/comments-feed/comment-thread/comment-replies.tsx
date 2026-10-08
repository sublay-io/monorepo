import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Comment as CommentType } from "@sublay/react-native";
import { CommentThreadProps } from "./comment-thread";
import useUIState from "../../../hooks/use-ui-state";

interface CommentRepliesProps {
  depth: number;
  isCollapsed: boolean;
  loading: boolean;
  visibleReplies: CommentType[];
  hiddenRepliesCount: number;
  hasMore: boolean;
  onLoadMore: () => void;
  onDeleteComment?: (commentId: string) => void;
  onReportComment?: (commentId: string) => void;
  CommentThreadComponent: React.ComponentType<CommentThreadProps>;
}

function CommentReplies({
  depth,
  isCollapsed,
  loading,
  visibleReplies,
  hiddenRepliesCount,
  hasMore,
  onLoadMore,
  onDeleteComment,
  onReportComment,
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
    <View>
      {visibleReplies.map((reply: CommentType, index: number) => (
        <CommentThreadComponent
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          isLastReply={index === visibleReplies.length - 1}
          onDeleteComment={onDeleteComment}
          onReportComment={onReportComment}
        />
      ))}

      {/* Load more replies button */}
      {hasMore && (
        // Indented to the level the replies load at (same 24px-per-level cap as single comments)
        <View className="mt-3" style={{ marginLeft: Math.min(depth + 1, 6) * 24 + 4 }}>
          <TouchableOpacity
            onPress={onLoadMore}
            disabled={loading}
            className={`flex-row items-center gap-2 px-2 py-1 rounded-full ${
              theme === 'dark' ? 'active:bg-blue-950' : 'active:bg-blue-50'
            }`}
          >
            <Text
              className={`text-xs ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}
            >
              +
            </Text>
            <Text
              className={`text-xs font-medium ${
                theme === 'dark' ? 'text-blue-500' : 'text-blue-600'
              }`}
            >
              {loading ? "Loading..." : loadMoreLabel}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default CommentReplies;
