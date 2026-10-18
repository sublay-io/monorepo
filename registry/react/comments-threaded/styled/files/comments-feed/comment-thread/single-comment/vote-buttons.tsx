import {
  useCommentSection,
  useUser,
  Comment as CommentType,
  useReactionToggle,
} from "@sublay/react-js";
import useUIState from "../../../../hooks/use-ui-state";
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
  const { theme } = useUIState();
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

  // 🎨 CUSTOMIZATION: Vote button styling (Default: 12px for small, 16px for normal)
  const iconSize =
    size === "small"
      ? { width: "12px", height: "12px" }
      : { width: "16px", height: "16px" };
  // 🎨 CUSTOMIZATION: Score display styling (Default: 12px for small, 14px for normal)
  const textSize = size === "small" ? "13px" : "14px";
  // The padding is on the buttons, not around them: a bigger area to click
  const buttonPadding = size === "small" ? "6px" : "8px";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        // 🎨 CUSTOMIZATION: Vote button styling (Default: gray-100; gray-200 on
        // the highlighted comment, whose background is gray-100)
        backgroundColor: highlighted
          ? (theme === 'dark' ? "#525252" : "#E5E7EB")
          : (theme === 'dark' ? "#404040" : "#F3F4F6"),
        borderRadius: "9999px",
        padding: "2px",
        gap: "2px",
      }}
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
        style={{
          padding: buttonPadding,
          borderRadius: "50%",
          transition:
            "color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // 🎨 CUSTOMIZATION: Vote button styling (Default: blue-500)
          backgroundColor: userVote === "up" ? (theme === 'dark' ? "#60A5FA" : "#3B82F6") : "transparent",
          // 🎨 CUSTOMIZATION: Vote button styling (Default: gray-500 when neutral)
          color: userVote === "up" ? "#FFFFFF" : (theme === 'dark' ? "#A3A3A3" : "#6B7280"),
          border: "none",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          if (userVote !== "up") {
            // 🎨 CUSTOMIZATION: Upvote hover color (Default: blue-600)
            e.currentTarget.style.color = theme === 'dark' ? "#93C5FD" : "#2563EB";
            // 🎨 CUSTOMIZATION: Upvote hover background (Default: blue-100)
            e.currentTarget.style.backgroundColor = theme === 'dark' ? "rgba(96, 165, 250, 0.25)" : "#DBEAFE";
          }
        }}
        onMouseLeave={(e) => {
          if (userVote !== "up") {
            // 🎨 CUSTOMIZATION: Vote button styling (Default: gray-500)
            e.currentTarget.style.color = theme === 'dark' ? "#A3A3A3" : "#6B7280";
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
        title={strings.upvote}
      >
        <svg
          style={iconSize}
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
        style={{
          // 🎨 CUSTOMIZATION: Score display styling (Default: medium)
          fontWeight: 500,
          fontSize: textSize,
          minWidth: "20px",
          textAlign: "center",
          // 🎨 CUSTOMIZATION: Score display styling. Colored only by your own
          // vote: blue after an upvote, red after a downvote, else gray-700
          color:
            userVote === "up"
              ? (theme === 'dark' ? "#60A5FA" : "#3B82F6")
              : userVote === "down"
              ? (theme === 'dark' ? "#F87171" : "#EF4444")
              : (theme === 'dark' ? "#D4D4D4" : "#374151"),
        }}
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
          if (user && !user.username) {
            callbacks?.usernameRequiredCallback?.();
            return;
          }
          handleVote("down");
        }}
        style={{
          padding: buttonPadding,
          borderRadius: "50%",
          transition:
            "color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // 🎨 CUSTOMIZATION: Vote button styling (Default: red-500)
          backgroundColor: userVote === "down" ? (theme === 'dark' ? "#F87171" : "#EF4444") : "transparent",
          // 🎨 CUSTOMIZATION: Vote button styling (Default: gray-500 when neutral)
          color: userVote === "down" ? "#FFFFFF" : (theme === 'dark' ? "#A3A3A3" : "#6B7280"),
          border: "none",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          if (userVote !== "down") {
            // 🎨 CUSTOMIZATION: Downvote hover color (Default: red-600)
            e.currentTarget.style.color = theme === 'dark' ? "#FCA5A5" : "#DC2626";
            // 🎨 CUSTOMIZATION: Downvote hover background (Default: red-100)
            e.currentTarget.style.backgroundColor = theme === 'dark' ? "rgba(248, 113, 113, 0.25)" : "#FEE2E2";
          }
        }}
        onMouseLeave={(e) => {
          if (userVote !== "down") {
            // 🎨 CUSTOMIZATION: Vote button styling (Default: gray-500)
            e.currentTarget.style.color = theme === 'dark' ? "#A3A3A3" : "#6B7280";
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
        title={strings.downvote}
      >
        <svg
          style={iconSize}
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
