import { View, Text, TouchableOpacity } from "react-native";
import {
  useCommentSection,
  useUser,
  Comment as CommentType,
  useReactionToggle,
} from "@sublay/react-native";
import ChevronIcon from "~shared/react-native/chevron-icon";
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
  const inactiveIconColor = theme === 'dark' ? '#A3A3A3' : '#6B7280';
  // The padding is on the buttons, not around them: a bigger area to tap
  const buttonPadding = size === "small" ? 5.25 : 7;

  return (
    <View
      // Taps on the score or between the arrows stop here instead of reaching
      // the comment, which would collapse it; the arrows take their own taps
      onStartShouldSetResponder={() => true}
      // One step stronger on the highlighted comment, whose background is #F3F4F6
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 9999,
        gap: 1.75,
        padding: 1.75,
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
          padding: buttonPadding,
          borderRadius: 9999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: userVote === "up"
            ? theme === 'dark' ? '#60A5FA' : '#3B82F6'
            : 'transparent',
        }}
      >
        <ChevronIcon
          direction="up"
          size={iconSize}
          strokeWidth={2.5}
          color={userVote === "up" ? '#FFFFFF' : inactiveIconColor}
        />
      </TouchableOpacity>

      {/* Score */}
      <Text
        style={{
          fontWeight: '500',
          textAlign: 'center',
          minWidth: 20,
          fontSize: size === "small" ? 13 : 12.25,
          lineHeight: size === "small" ? 18 : 17.5,
          // 🎨 CUSTOMIZATION: Score color. Colored only by your own vote: blue
          // after an upvote, red after a downvote, neutral otherwise
          color:
            userVote === "up"
              ? theme === 'dark' ? '#60A5FA' : '#3B82F6'
              : userVote === "down"
                ? theme === 'dark' ? '#F87171' : '#EF4444'
                : theme === 'dark' ? '#D4D4D4' : '#374151',
        }}
      >
        {/* The left-to-right mark keeps a negative score's minus sign on the
            left in right-to-left layouts (otherwise -1 shows as "1-"). */}
        {`\u200E${netScore}`}
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
          padding: buttonPadding,
          borderRadius: 9999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: userVote === "down"
            ? theme === 'dark' ? '#F87171' : '#EF4444'
            : 'transparent',
        }}
      >
        <ChevronIcon
          direction="down"
          size={iconSize}
          strokeWidth={2.5}
          color={userVote === "down" ? '#FFFFFF' : inactiveIconColor}
        />
      </TouchableOpacity>
    </View>
  );
}

export default VoteButtons;
