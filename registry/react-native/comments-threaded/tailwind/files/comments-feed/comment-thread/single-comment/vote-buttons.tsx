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
  // The padding is on the buttons, not around them: a bigger area to tap
  const buttonPadding = size === "small" ? "p-1.5" : "p-2";

  return (
    <View
      // Taps on the score or between the arrows stop here instead of reaching
      // the comment, which would collapse it; the arrows take their own taps
      onStartShouldSetResponder={() => true}
      // One step stronger on the highlighted comment, whose background is gray-100
      className={`flex-row items-center rounded-full gap-0.5 p-0.5 ${
        highlighted
          ? theme === 'dark' ? 'bg-neutral-600' : 'bg-gray-200'
          : theme === 'dark' ? 'bg-neutral-700' : 'bg-gray-50'
      }`}
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
        className={`${buttonPadding} rounded-full items-center justify-center ${
          userVote === "up"
            ? theme === 'dark'
              ? 'bg-blue-400'
              : 'bg-blue-500'
            : 'bg-transparent'
        }`}
      >
        <Text
          style={{ fontSize: iconSize, lineHeight: iconSize }}
          className={
            userVote === "up"
              ? 'text-white'
              : theme === 'dark'
                ? 'text-neutral-400'
                : 'text-gray-500'
          }
        >
          ▲
        </Text>
      </TouchableOpacity>

      {/* Score */}
      <Text
        className={`font-medium text-center min-w-[20px] ${
          size === "small" ? "text-[13px] leading-[18px]" : "text-sm"
        } ${
          // Colored only by your own vote: blue after an upvote, red after a
          // downvote, neutral when you haven't voted
          userVote === "up"
            ? theme === 'dark'
              ? 'text-blue-400'
              : 'text-blue-500'
            : userVote === "down"
              ? theme === 'dark'
                ? 'text-red-400'
                : 'text-red-500'
              : theme === 'dark'
                ? 'text-neutral-300'
                : 'text-gray-700'
        }`}
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
        className={`${buttonPadding} rounded-full items-center justify-center ${
          userVote === "down"
            ? theme === 'dark'
              ? 'bg-red-400'
              : 'bg-red-500'
            : 'bg-transparent'
        }`}
      >
        <Text
          style={{ fontSize: iconSize, lineHeight: iconSize }}
          className={
            userVote === "down"
              ? 'text-white'
              : theme === 'dark'
                ? 'text-neutral-400'
                : 'text-gray-500'
          }
        >
          ▼
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default VoteButtons;
