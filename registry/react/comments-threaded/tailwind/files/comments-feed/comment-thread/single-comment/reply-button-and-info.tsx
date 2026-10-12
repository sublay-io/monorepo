import React from "react";

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
  return (
    <div
      className="flex items-center gap-4 text-xs"
      // 🎨 CUSTOMIZATION: Reply button spacing and sizing
    >
      {canReply && (
      <button
        onClick={() => setShowReplyForm((prev) => !prev)}
        className="text-gray-500 dark:text-neutral-400 font-medium px-2 py-1 rounded -ml-2 transition-all duration-150 bg-transparent border-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
        // 🎨 CUSTOMIZATION: Reply button styling
      >
        Reply
      </button>
      )}
      {hasReplies && (
        <span
          className="text-gray-500 dark:text-neutral-400"
          // 🎨 CUSTOMIZATION: Reply count styling
        >
          {replyCount} {replyCount === 1 ? "reply" : "replies"}
        </span>
      )}
    </div>
  );
}

export default ReplyButtonAndInfo;
