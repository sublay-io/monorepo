import { useCommentSection, getUserName } from "@sublay/react-js";
import { resetButton } from "~shared/react/reset-styles";

function ReplyBanner() {
  const {
    repliedToComment,
    showReplyBanner,
    setShowReplyBanner,
    pushMention,
    setRepliedToComment,
  } = useCommentSection();

  let repliedToUser = "";
  if (pushMention) {
    repliedToUser = getUserName(pushMention);
  } else if (repliedToComment?.user) {
    repliedToUser = getUserName(repliedToComment.user);
  }

  return (
    <div
      style={{
        bottom: showReplyBanner ? 0 : -60,
      }}
      className="h-auto absolute left-0 right-0 z-10 overflow-hidden transition-all duration-300 bg-gray-200 dark:bg-neutral-700 px-3 py-2"
    >
      <div
        className="flex items-center justify-between h-full"
      >
        <span className="text-gray-600 dark:text-neutral-400 text-xs">
          Replying to {repliedToUser}
        </span>
        <button
          onClick={() => {
            setRepliedToComment!(null);
            setShowReplyBanner!({ newState: false });
          }}
          style={resetButton}
          className="text-base dark:text-neutral-300"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

export default ReplyBanner;
