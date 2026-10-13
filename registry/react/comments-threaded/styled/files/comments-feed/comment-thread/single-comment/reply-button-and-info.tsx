import React from "react";
import useUIState from "../../../../hooks/use-ui-state";

function ReplyButtonAndInfo({
  hasReplies,
  replyCount,
  setShowReplyForm,
  canReply = true,
}: {
  hasReplies: boolean;
  replyCount: number;
  setShowReplyForm: React.Dispatch<React.SetStateAction<boolean>>;
  // false hides the Reply button (the reply count still shows).
  canReply?: boolean;
}) {
  const { theme } = useUIState();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        // 🎨 CUSTOMIZATION: Reply button styling (Default: 16px)
        gap: "16px",
        // 🎨 CUSTOMIZATION: Reply button styling (Default: 13px)
        fontSize: "13px",
      }}
    >
      {canReply && (
      <button
        onClick={() => setShowReplyForm((prev) => !prev)}
        style={{
          // 🎨 CUSTOMIZATION: Reply button styling (Default: gray-500)
          color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
          // 🎨 CUSTOMIZATION: Reply button styling (Default: medium)
          fontWeight: 500,
          padding: "4px 8px",
          borderRadius: "4px",
          marginInlineStart: "-8px",
          transition: "all 150ms ease-in-out",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = theme === 'dark' ? "#93C5FD" : "#2563EB";
          e.currentTarget.style.backgroundColor = theme === 'dark' ? "rgba(96, 165, 250, 0.1)" : "#EFF6FF";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = theme === 'dark' ? "#A3A3A3" : "#6B7280";
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        Reply
      </button>
      )}
      {hasReplies && (
        <span
          style={{
            // 🎨 CUSTOMIZATION: Reply button styling (Default: gray-500)
            color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
          }}
        >
          {replyCount} {replyCount === 1 ? "reply" : "replies"}
        </span>
      )}
    </div>
  );
}

export default ReplyButtonAndInfo;
