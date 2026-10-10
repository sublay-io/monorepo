import { useState } from "react";
import {
  Comment as CommentType,
  UserMention,
  getUserName,
  useCommentSection,
  useReactionToggle,
  useUser,
} from "@sublay/react-js";
import {
  parseContentWithMentions,
  UserAvatar,
} from "@sublay/ui-core-react-js";
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
import useUIState from "../../../../hooks/use-ui-state";

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
  const { theme } = useUIState();
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
      style={{
        fontSize: "12px",
        color: theme === 'dark' ? "#9CA3AF" : "#6B7280",
        fontWeight: 500,
        padding: "4px 8px",
        marginLeft: "-8px",
        borderRadius: "4px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
      }}
    >
      Remove your vote
    </button>
  );
}

function SingleComment({
  comment: commentFromSection,
  depth,
  hasReplies,
  isCollapsed,
  replyCount,
  showReplies,
  onToggleCollapse,
}: SingleCommentProps) {
  const { user } = useUser();
  const { callbacks, highlightedComment } = useCommentSection();
  const { theme } = useUIState();
  const comment = commentFromSection;
  const [showReplyForm, setShowReplyForm] = useState(false);
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

  const highlightColor =
    highlightedComment?.comment.id === comment.id
      ? (theme === 'dark' ? "#1E40AF" : "#dbeafe")
      : "transparent";

  // The API sends aspectRatio as a string (e.g. "1.5"), so coerce before doing
  // math with it. Falls back to 1 (square) if it's missing or unparsable.
  const gifAspectRatio = Number(comment.gif?.aspectRatio) || 1;

  return (
    <>
    <div
      style={{
        marginLeft: `-${indentationPx}px`,
        paddingLeft: `${indentationPx}px`,
        backgroundColor: highlightColor,
      }}
    >
      <div
        style={{
          position: "relative",
          padding: `${ROW_PADDING_Y}px 0`,
          borderRadius: "6px",
          transition: "colors 150ms ease-in-out",
        }}
      >
        {/* Line from this comment's avatar down to the rows listed under it */}
        {(showReplies || showForm) && <ThreadStem />}

        <div style={{ display: "flex" }}>
          {/* Avatar positioned for threading line connection with top margin */}
          <div
            style={{
              flexShrink: 0,
              marginRight: `${AVATAR_GAP}px`,
              position: "relative",
              marginTop: `${AVATAR_OFFSET_TOP}px`,
            }}
          >
            {isPlaceholderRow || tombstone ? (
              <div
                style={{
                  position: "relative",
                  zIndex: 10,
                  width: `${AVATAR_SIZE}px`,
                  height: `${AVATAR_SIZE}px`,
                  borderRadius: `${AVATAR_SIZE}px`,
                  backgroundColor: theme === 'dark' ? "#374151" : "#E5E7EB",
                }}
              />
            ) : (
              <div
                style={{ position: "relative", zIndex: 10, cursor: "pointer" }}
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
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                minHeight: "28px",
                fontSize: "12px",
                fontStyle: "italic",
                color: theme === 'dark' ? "#9CA3AF" : "#6B7280",
              }}
            >
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
                    style={{
                      fontSize: "12px",
                      fontStyle: "normal",
                      fontWeight: 500,
                      color: theme === 'dark' ? "#60A5FA" : "#2563EB",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                // 🎨 CUSTOMIZATION: Spacing (Default: 4px, derived from 8/2)
                marginBottom: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  // 🎨 CUSTOMIZATION: Spacing (Default: 8px)
                  gap: "8px",
                  // 🎨 CUSTOMIZATION: Typography - Timestamp (Default: 12px)
                  fontSize: "12px",
                  // 🎨 CUSTOMIZATION: Typography - Timestamp (Default: gray-500)
                  color: theme === 'dark' ? "#9CA3AF" : "#6B7280",
                }}
              >
                {tombstone ? (
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: "12px",
                      color: theme === 'dark' ? "#9CA3AF" : "#6B7280",
                    }}
                  >
                    {tombstone}
                  </span>
                ) : (
                <span
                  style={{
                    // 🎨 CUSTOMIZATION: Typography - Author (Default: medium)
                    fontWeight: 500,
                    // 🎨 CUSTOMIZATION: Typography - Author (Default: 12px)
                    fontSize: "12px",
                    // 🎨 CUSTOMIZATION: Typography - Author (Default: gray-700)
                    color: theme === 'dark' ? "#D1D5DB" : "#374151",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    if (user?.id === comment.user?.id) {
                      callbacks?.currentUserClickCallback?.();
                    } else {
                      callbacks?.otherUserClickCallback?.(comment.user?.id ?? "", comment.user?.foreignId);
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  {getUserName(comment.user ?? {})}
                </span>
                )}
                <span style={{ color: theme === 'dark' ? "#9CA3AF" : "#6B7280" }}>•</span>
                <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                {isCollapsed && hasReplies && (
                  <span style={{ color: theme === 'dark' ? "#60A5FA" : "#3B82F6", fontSize: "12px" }}>
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
              <p
                style={{
                  fontSize: "12px",
                  fontStyle: "italic",
                  color: theme === 'dark' ? "#9CA3AF" : "#6B7280",
                  marginBottom: "12px",
                  lineHeight: "1.625",
                }}
              >
                {tombstone}
              </p>
            )}

            {!isCollapsed && !tombstone && (
              <>
                {comment.content && (
                  <p
                    style={{
                      // 🎨 CUSTOMIZATION: Typography - Comment body (Default: 12px)
                      fontSize: "12px",
                      // 🎨 CUSTOMIZATION: Typography - Comment body (Default: gray-800)
                      color: theme === 'dark' ? "#E5E7EB" : "#1F2937",
                      // 🎨 CUSTOMIZATION: Spacing (Default: 12px)
                      marginBottom: "12px",
                      lineHeight: "1.625",
                    }}
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
                    style={{
                      width: gifAspectRatio > 1 ? 200 : 200 * gifAspectRatio,
                      height: gifAspectRatio < 1 ? 200 : 200 / gifAspectRatio,
                      borderRadius: "0.25rem",
                      overflow: "hidden",
                      objectFit: "cover",
                      // 🎨 CUSTOMIZATION: Spacing (Default: 12px)
                      marginBottom: "12px",
                    }}
                  />
                )}

                {isOwnRemoved && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: theme === 'dark' ? "#9CA3AF" : "#6B7280",
                      marginBottom: "12px",
                    }}
                  >
                    {ownRemovedLabel}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <ReplyButtonAndInfo
                    hasReplies={replyCount > 0}
                    replyCount={replyCount}
                    setShowReplyForm={setShowReplyForm}
                    canReply={!isOwnRemoved}
                  />
                  {/* Vote buttons inline with reply options */}
                  {!isOwnRemoved && (
                    <div style={{ flexShrink: 0 }}>
                      <VoteButtons
                        comment={comment}
                        size="small"
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
        style={{
          marginTop: `-${ROW_PADDING_Y}px`,
          marginLeft: `-${indentationPx}px`,
          paddingLeft: `${indentationPx}px`,
          backgroundColor: highlightColor,
        }}
      >
        <div
          style={{
            position: "relative",
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
          <NewReplyForm comment={comment} setShowReplyForm={setShowReplyForm} />
        </div>
      </div>
    )}
    </>
  );
}

export default SingleComment;
