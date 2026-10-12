import { useState } from "react";
import {
  Comment as CommentType,
  type CommentCreateError,
  UserMention,
  getUserName,
  useCommentSection,
  useReactionToggle,
  useUser,
} from "@sublay/react-js";
import { parseContentWithMentions } from "~shared/react/parse-content-with-mentions";
import UserAvatar from "~shared/react/user-avatar";
import VoteButtons from "./vote-buttons";
import ActionMenu from "../action-menu";
import NewReplyForm from "../new-reply-form";
import ToggleRepliesVisibilty from "./toggle-replies-visibility";
import IndentationThreadingLines, {
  AVATAR_GAP,
  AVATAR_OFFSET_TOP,
  AVATAR_SIZE,
  INDENT,
  MAX_INDENT_DEPTH,
  ROW_PADDING_Y,
  ThreadStem,
} from "./indentation-threading-lines";
import ReplyButtonAndInfo from "./reply-button-and-info";
import { getCommentCreateErrorMessage } from "../../../../utils/comment-create-error";
import { cn } from "@/lib/utils";

interface SingleCommentProps {
  comment: CommentType;
  depth: number;
  hasReplies: boolean;
  isCollapsed: boolean;
  replyCount: number;
  /** Replies (or the row that loads them) are listed under this comment. */
  showReplies: boolean;
  onToggleCollapse: () => void;
}

// 🎨 CUSTOMIZATION: Where the threading line meets the reply form, measured
// from the top of the form's row (Default: 32px, level with its first line)
const REPLY_FORM_JOIN_Y = 32;

// The viewer's own reaction on a comment they can't otherwise interact with
// (its author blocked them): undoing it is still allowed.
function RemoveOwnReactionButton({ comment }: { comment: CommentType }) {
  const { currentReaction, toggleReaction } = useReactionToggle({
    targetType: "comment",
    targetId: comment.id,
    initialReaction: comment.userReaction,
    initialReactionCounts: comment.reactionCounts,
  });

  if (!currentReaction) return null;

  return (
    <button
      onClick={() => toggleReaction({ reactionType: currentReaction })}
      className="text-xs not-italic font-medium text-gray-500 dark:text-neutral-400 px-2 py-1 -ml-2 rounded bg-transparent border-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-300"
    >
      Remove your vote
    </button>
  );
}

function SingleComment({
  comment,
  depth,
  hasReplies,
  isCollapsed,
  replyCount,
  showReplies,
  onToggleCollapse,
}: SingleCommentProps) {
  const { user } = useUser();
  const { callbacks, highlightedComment, createError } = useCommentSection();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  // A reply to this comment that wasn't posted: the message shows under the
  // reply form, until the text is edited or something is sent again (the
  // section clears `createError` then). If the reply was refused because this
  // comment was deleted or removed in the meantime, the row has already turned
  // into its placeholder (no reply form), so the message shows on the row.
  const [dismissedReplyError, setDismissedReplyError] =
    useState<CommentCreateError | null>(null);
  const replyErrorMessage =
    createError &&
    createError.parentId === comment.id &&
    createError !== dismissedReplyError
      ? getCommentCreateErrorMessage(createError)
      : null;
  const [showBlockedComment, setShowBlockedComment] = useState(false);

  // isUnavailable wins over every other marker (the author blocked the
  // viewer): a neutral row, no reply/react. A comment by someone the viewer
  // blocked starts collapsed, and can be shown (then replied to / reacted to).
  const isUnavailable = !!comment.isUnavailable;
  const isBlockedCollapsed =
    !isUnavailable && !!comment.isAuthorBlocked && !showBlockedComment;
  const isPlaceholderRow = isUnavailable || isBlockedCollapsed;
  // Reddit-style tombstone, after isUnavailable: a user-deleted comment, or a
  // moderator-removed one served as a placeholder (its author gets it in full,
  // with content, and sees it normally). Replies underneath stay visible.
  const tombstone = isUnavailable
    ? null
    : comment.userDeletedAt
      ? "[deleted]"
      : comment.moderationStatus === "removed" && !comment.userId
        ? "[removed]"
        : null;

  // The viewer's own moderator-removed comment comes back in full (only its
  // author sees it, with a note saying so). The server refuses votes on it and
  // direct replies to it, so there are no vote buttons or Reply; delete stays.
  const isOwnRemoved =
    !tombstone && comment.moderationStatus === "removed" && !!comment.userId;
  const ownRemovedLabel = `Removed by a moderator${
    comment.moderationReason ? `: ${comment.moderationReason}` : ""
  } · only you can see this`;

  // How far this row sits in from the left edge of its thread. The highlight
  // reaches back across it, so a highlighted reply is coloured edge to edge.
  const indentationPx = Math.min(depth, MAX_INDENT_DEPTH) * INDENT;

  // The reply form is a row of its own under the comment, first on the line
  // its replies hang from.
  const showForm =
    showReplyForm &&
    !isPlaceholderRow &&
    !isCollapsed &&
    !tombstone &&
    !isOwnRemoved;

  const isHighlighted = highlightedComment?.comment.id === comment.id;
  // 🎨 CUSTOMIZATION: Highlighted comment background: a neutral step away
  // from the section background
  const highlightClass = isHighlighted && "bg-gray-100 dark:bg-[#333333]";
  // 🎨 CUSTOMIZATION: Highlight color on the indentation beside it
  const highlightGutterClass = isHighlighted && "bg-blue-100 dark:bg-blue-950";

  // The API sends aspectRatio as a string (e.g. "1.5"), so coerce before doing
  // math with it. Falls back to 1 (square) if it's missing or unparsable.
  const gifAspectRatio = Number(comment.gif?.aspectRatio) || 1;

  return (
    <>
    <div
      className={cn(highlightGutterClass)}
      style={{
        marginLeft: `-${indentationPx}px`,
        paddingLeft: `${indentationPx}px`,
      }}
    >
      <div
        className={cn("relative transition-colors duration-150", highlightClass)}
        style={{ padding: `${ROW_PADDING_Y}px 0` }}
      >
        {/* Line from this comment's avatar down to the rows listed under it */}
        {(showReplies || showForm) && <ThreadStem />}

        <div className="flex">
          {/* Avatar positioned for threading line connection with top margin */}
          <div
            className="flex-shrink-0 relative"
            style={{
              marginRight: `${AVATAR_GAP}px`,
              marginTop: `${AVATAR_OFFSET_TOP}px`,
            }}
          >
            {isPlaceholderRow || tombstone ? (
              <div
                className="relative z-10 rounded-full bg-gray-200 dark:bg-neutral-700"
                style={{ width: `${AVATAR_SIZE}px`, height: `${AVATAR_SIZE}px` }}
              />
            ) : (
              <div
                className="relative z-10 cursor-pointer"
                onClick={() => {
                  if (user?.id === comment.user?.id) {
                    callbacks?.currentUserClickCallback?.();
                  } else {
                    callbacks?.otherUserClickCallback?.(comment.user?.id ?? "", comment.user?.foreignId);
                  }
                }}
              >
                <UserAvatar
                  user={comment.user ?? {}}
                  borderRadius={AVATAR_SIZE}
                  size={AVATAR_SIZE}
                />
              </div>
            )}
          </div>

          {/* Comment content area */}
          {isPlaceholderRow ? (
            <div className="flex-1 min-w-0 flex items-center gap-2 min-h-7 text-xs italic text-gray-500 dark:text-neutral-400">
              {isUnavailable ? (
                <>
                  <span>This comment is unavailable</span>
                  <RemoveOwnReactionButton comment={comment} />
                </>
              ) : (
                <>
                  <span>Comment from a user you blocked</span>
                  <button
                    onClick={() => setShowBlockedComment(true)}
                    className="text-xs not-italic font-medium text-blue-600 dark:text-blue-400 bg-transparent border-none p-0 cursor-pointer hover:underline"
                  >
                    Show anyway
                  </button>
                </>
              )}
              {hasReplies && (
                <ToggleRepliesVisibilty
                  isCollapsed={isCollapsed}
                  onToggleCollapse={onToggleCollapse}
                />
              )}
            </div>
          ) : (
          <div className="flex-1 min-w-0">
            <div
              className="flex items-center justify-between mb-1"
              // 🎨 CUSTOMIZATION: Spacing
            >
              <div
                className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400"
                // 🎨 CUSTOMIZATION: Typography and spacing
              >
                {tombstone ? (
                  <span className="font-medium text-xs text-gray-500 dark:text-neutral-400">
                    {tombstone}
                  </span>
                ) : (
                <span
                  className="font-medium text-xs text-gray-700 dark:text-neutral-300 cursor-pointer hover:underline"
                  // 🎨 CUSTOMIZATION: Author name styling
                  onClick={() => {
                    if (user?.id === comment.user?.id) {
                      callbacks?.currentUserClickCallback?.();
                    } else {
                      callbacks?.otherUserClickCallback?.(comment.user?.id ?? "", comment.user?.foreignId);
                    }
                  }}
                >
                  {getUserName(comment.user ?? {})}
                </span>
                )}
                <span className="text-gray-500 dark:text-neutral-400">•</span>
                <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                {isCollapsed && hasReplies && (
                  <span className="text-blue-500 dark:text-blue-400 text-xs">
                    ({replyCount} {replyCount === 1 ? "reply" : "replies"})
                  </span>
                )}
                {hasReplies && (
                  <ToggleRepliesVisibilty
                    isCollapsed={isCollapsed}
                    onToggleCollapse={onToggleCollapse}
                  />
                )}
              </div>
              {!tombstone && <ActionMenu comment={comment} />}
            </div>

            {!isCollapsed && tombstone && (
              <p className="text-xs italic text-gray-500 dark:text-neutral-400 mb-3 leading-relaxed">
                {tombstone}
              </p>
            )}

            {!isCollapsed && tombstone && replyErrorMessage && (
              <p
                role="alert"
                className="text-xs text-gray-500 dark:text-neutral-400 mb-3"
              >
                {replyErrorMessage}
              </p>
            )}

            {!isCollapsed && !tombstone && (
              <>
                {comment.content && (
                  <p
                    className="text-xs text-gray-800 dark:text-neutral-200 mb-3 leading-relaxed"
                    // 🎨 CUSTOMIZATION: Comment body typography
                  >
                    {parseContentWithMentions(
                      comment.content,
                      comment.mentions
                        ?.filter((m): m is UserMention => 'username' in m)
                        .map((m) => ({ id: m.id, foreignId: m.foreignId ?? undefined, username: m.username })),
                      user?.id,
                      callbacks?.currentUserClickCallback,
                      callbacks?.otherUserClickCallback
                    )}
                  </p>
                )}

                {comment.gif && (
                  <img
                    src={comment.gif.gifUrl}
                    alt={comment.gif.altText}
                    className="rounded overflow-hidden object-cover mb-3"
                    style={{
                      // 🎨 CUSTOMIZATION: GIF dimensions (dynamic based on aspect ratio)
                      width: gifAspectRatio > 1 ? 200 : 200 * gifAspectRatio,
                      height: gifAspectRatio < 1 ? 200 : 200 / gifAspectRatio,
                    }}
                  />
                )}

                {isOwnRemoved && (
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mb-3">
                    {ownRemovedLabel}
                  </p>
                )}

                {isOwnRemoved && replyErrorMessage && (
                  <p
                    role="alert"
                    className="text-xs text-gray-500 dark:text-neutral-400 mb-3"
                  >
                    {replyErrorMessage}
                  </p>
                )}

                <div
                  className="flex items-center justify-between"
                  // 🎨 CUSTOMIZATION: Actions layout
                >
                  <ReplyButtonAndInfo
                    hasReplies={replyCount > 0}
                    replyCount={replyCount}
                    setShowReplyForm={setShowReplyForm}
                    canReply={!isOwnRemoved}
                  />
                  {/* Vote buttons inline with reply options */}
                  {!isOwnRemoved && (
                    <div className="flex-shrink-0">
                      <VoteButtons
                        comment={comment}
                        size="small"
                        highlighted={isHighlighted}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          )}
        </div>
      </div>
    </div>

    {/* Reply form: lined up with the comment's content, and pulled up into
        the row's bottom padding so it sits right under the reply button */}
    {showForm && (
      <div
        className={cn(highlightGutterClass)}
        style={{
          marginTop: `-${ROW_PADDING_Y}px`,
          marginLeft: `-${indentationPx}px`,
          paddingLeft: `${indentationPx}px`,
        }}
      >
        <div className={cn(highlightClass)}>
        <div
          className="relative"
          style={{
            marginLeft: `${INDENT}px`,
            paddingLeft: `${AVATAR_SIZE + AVATAR_GAP - INDENT}px`,
            paddingBottom: `${ROW_PADDING_Y}px`,
          }}
        >
          <IndentationThreadingLines
            isLastReply={!showReplies}
            joinAt={REPLY_FORM_JOIN_Y}
            reach={AVATAR_SIZE + AVATAR_GAP - INDENT}
          />
          <NewReplyForm
            comment={comment}
            setShowReplyForm={setShowReplyForm}
            replyContent={replyContent}
            setReplyContent={setReplyContent}
            errorMessage={replyErrorMessage}
            onDismissError={() => {
              if (replyErrorMessage) setDismissedReplyError(createError ?? null);
            }}
          />
        </div>
        </div>
      </div>
    )}
    </>
  );
}

export default SingleComment;
