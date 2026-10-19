import React from "react";
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
  return (
    <div
      className="flex flex-1 items-center justify-between gap-2 text-[13px]"
      // 🎨 CUSTOMIZATION: Reply button spacing and sizing
    >
      {hasReplies ? (
        <span
          className="text-gray-500 dark:text-neutral-400"
          // 🎨 CUSTOMIZATION: Reply count styling
        >
          {strings.replyCount(replyCount)}
        </span>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-[7px]">
        {menu}
        {canReply && (
          <button
            onClick={() => setShowReplyForm((prev) => !prev)}
            className="text-gray-500 dark:text-neutral-400 font-medium px-2 py-1 rounded transition-all duration-150 bg-transparent border-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-400/10"
            // 🎨 CUSTOMIZATION: Reply button styling
          >
            {strings.reply}
          </button>
        )}
      </div>
    </div>
  );
}

export default ReplyButtonAndInfo;
