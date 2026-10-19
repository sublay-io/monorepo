import React from "react";
import useUIState from "../../../../hooks/use-ui-state";
import strings from "../../../../utils/strings";

// The reply count at the start of the row, and the comment's buttons at the
// end: the menu, then Reply (the vote buttons follow, in single-comment.tsx).
function ReplyButtonAndInfo({
  hasReplies,
  replyCount,
  setShowReplyForm,
  canReply = true,
  menu,
}: {
  hasReplies: boolean;
  replyCount: number;
  setShowReplyForm: React.Dispatch<React.SetStateAction<boolean>>;
  // false hides the Reply button (the reply count still shows).
  canReply?: boolean;
  // The options button, shown before Reply.
  menu?: React.ReactNode;
}) {
  const { theme } = useUIState();

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        // 🎨 CUSTOMIZATION: Reply button styling (Default: 13px)
        fontSize: "13px",
      }}
    >
      {hasReplies ? (
        <span
          style={{
            // 🎨 CUSTOMIZATION: Reply count color (Default: gray-500)
            color: theme === 'dark' ? "#A3A3A3" : "#6B7280",
          }}
        >
          {strings.replyCount(replyCount)}
        </span>
      ) : (
        <span />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        {menu}
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
            {strings.reply}
          </button>
        )}
      </div>
    </div>
  );
}

export default ReplyButtonAndInfo;
