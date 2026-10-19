import {
  useCommentSection,
  useUser,
  Comment as CommentType,
  useReactionToggle,
} from "@sublay/react-js";
import { cn } from "~shared/react/cn";
import strings from "../../../../utils/strings";

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

  // 🎨 CUSTOMIZATION: Vote button sizing
  const iconClass = size === "small" ? "w-3 h-3" : "w-4 h-4";
  const textClass = size === "small" ? "text-[13px]" : "text-sm";
  // The padding is on the buttons, not around them: a bigger area to click
  const buttonPaddingClass = size === "small" ? "p-1.5" : "p-2";

  return (
    <div
      className={cn(
        // 🎨 CUSTOMIZATION: Vote button container styling
        "inline-flex items-center",
        // One step stronger on the highlighted comment, whose background is gray-100
        highlighted
          ? "bg-gray-200 dark:bg-neutral-600"
          : "bg-gray-50 dark:bg-neutral-700",
        "rounded-full",
        "p-0.5",
        "gap-0.5"
      )}
    >
      {/* Upvote Button */}
      <button
        onClick={() => {
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
        className={cn(
          // 🎨 CUSTOMIZATION: Upvote button styling
          buttonPaddingClass,
          "rounded-full",
          "transition-colors duration-150",
          "flex items-center justify-center",
          "border-none cursor-pointer",
          userVote === "up"
            ? "bg-blue-500 dark:bg-blue-400 text-white"
            : "bg-transparent text-gray-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-400/25"
        )}
        title={strings.upvote}
      >
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m4.5 15.75 7.5-7.5 7.5 7.5"
          />
        </svg>
      </button>

      {/* Score */}
      <span
        dir="ltr"
        className={cn(
          // 🎨 CUSTOMIZATION: Score display styling
          "font-medium min-w-[20px] text-center",
          textClass,
          // Colored only by your own vote: blue after an upvote, red after a
          // downvote, neutral when you haven't voted
          userVote === "up"
            ? "text-blue-500 dark:text-blue-400"
            : userVote === "down"
            ? "text-red-500 dark:text-red-400"
            : "text-gray-700 dark:text-neutral-300"
        )}
      >
        {/* A negative score keeps its minus sign on the left in right-to-left
            layouts too (the browser would otherwise show -1 as "1-"). */}
        {netScore}
      </span>

      {/* Downvote Button */}
      <button
        onClick={() => {
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
        className={cn(
          // 🎨 CUSTOMIZATION: Downvote button styling
          buttonPaddingClass,
          "rounded-full",
          "transition-colors duration-150",
          "flex items-center justify-center",
          "border-none cursor-pointer",
          userVote === "down"
            ? "bg-red-500 dark:bg-red-400 text-white"
            : "bg-transparent text-gray-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-400/25"
        )}
        title={strings.downvote}
      >
        <svg
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
    </div>
  );
}

export default VoteButtons;
