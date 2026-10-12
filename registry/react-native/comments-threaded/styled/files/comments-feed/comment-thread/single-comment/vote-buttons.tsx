import { View, Text, TouchableOpacity } from "react-native";
import {
  useCommentSection,
  useUser,
  Comment as CommentType,
  useReactionToggle,
} from "@sublay/react-native";
import useUIState from "../../../../hooks/use-ui-state";

interface VoteButtonsProps {
  comment: CommentType;
  size?: "small" | "normal";
  /** The comment is the highlighted one: the pill steps away from its background. */
  highlighted?: boolean;
}

function VoteButtons({
  comment,
  size = "small",
  highlighted = false,
}: VoteButtonsProps) {
  const { user } = useUser();
  const { callbacks } = useCommentSection();
  const { theme } = useUIState();

  const { currentReaction, reactionCounts, toggleReaction } = useReactionToggle({
    targetType: "comment",
    targetId: comment.id,
    initialReaction: comment.userReaction,
    initialReactionCounts: comment.reactionCounts,
  });

  const netScore = (reactionCounts.upvote || 0) - (reactionCounts.downvote || 0);

  const userVote: "up" | "down" | null = currentReaction === "upvote"
    ? "up"
    : currentReaction === "downvote"
    ? "down"
    : null;

  const handleVote = (voteType: "up" | "down") => {
    toggleReaction({ reactionType: voteType === "up" ? "upvote" : "downvote" });
  };

  // Size-based styling
  const iconSize = size === "small" ? 12 : 16;
  const containerPadding =
    size === "small"
      ? { paddingHorizontal: 8, paddingVertical: 4 }
      : { paddingHorizontal: 12, paddingVertical: 6 };

  return (
    <View
      // One step stronger on the highlighted comment, whose background is #F3F4F6
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 9999,
        gap: 4,
        ...containerPadding,
        backgroundColor: highlighted
          ? theme === 'dark' ? '#525252' : '#E5E7EB'
          : theme === 'dark' ? '#404040' : '#F9FAFB',
      }}
    >
      {/* Upvote Button */}
      <TouchableOpacity
        onPress={() => {
          if (!user) {
            callbacks?.loginRequiredCallback?.();
            return;
          }
          if (!user.username && callbacks?.usernameRequiredCallback) {
            callbacks.usernameRequiredCallback();
            return;
          }
          handleVote("up");
        }}
        style={{
          padding: 4,
          borderRadius: 9999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: userVote === "up"
            ? theme === 'dark' ? '#60A5FA' : '#3B82F6'
            : 'transparent',
        }}
      >
        <Text
          style={{
            fontSize: iconSize,
            lineHeight: iconSize,
            color: userVote === "up"
              ? '#FFFFFF'
              : theme === 'dark' ? '#A3A3A3' : '#6B7280',
          }}
        >
          ▲
        </Text>
      </TouchableOpacity>

      {/* Score */}
      <Text
        style={{
          fontWeight: '500',
          textAlign: 'center',
          minWidth: 20,
          fontSize: size === "small" ? 12 : 14,
          lineHeight: size === "small" ? 16 : 20,
          // 🎨 CUSTOMIZATION: Score color (positive / negative / zero)
          color:
            netScore > 0
              ? theme === 'dark' ? '#60A5FA' : '#3B82F6'
              : netScore < 0
                ? theme === 'dark' ? '#F87171' : '#EF4444'
                : theme === 'dark' ? '#D4D4D4' : '#374151',
        }}
      >
        {netScore}
      </Text>

      {/* Downvote Button */}
      <TouchableOpacity
        onPress={() => {
          if (!user) {
            callbacks?.loginRequiredCallback?.();
            return;
          }
          if (!user.username && callbacks?.usernameRequiredCallback) {
            callbacks.usernameRequiredCallback();
            return;
          }
          handleVote("down");
        }}
        style={{
          padding: 4,
          borderRadius: 9999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: userVote === "down"
            ? theme === 'dark' ? '#F87171' : '#EF4444'
            : 'transparent',
        }}
      >
        <Text
          style={{
            fontSize: iconSize,
            lineHeight: iconSize,
            color: userVote === "down"
              ? '#FFFFFF'
              : theme === 'dark' ? '#A3A3A3' : '#6B7280',
          }}
        >
          ▼
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default VoteButtons;
